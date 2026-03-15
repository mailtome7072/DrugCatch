from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, UploadFile

from app.models.schemas import AnalysisData, AnalysisResult, DrugInfo
from app.services.drug_api import fetch_drug_by_features, fetch_drug_info
from app.services.drug_lookup import extract_unmatched_names, lookup_drugs
from app.services.image_classifier import classify_image
from app.services.ocr import extract_text

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_image(file: UploadFile):
    # 파일 형식 검사
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"지원하지 않는 파일 형식입니다: {file.content_type}. 이미지 파일(JPEG, PNG 등)을 업로드해주세요.",
        )

    image_bytes = await file.read()

    # 파일 크기 검사
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=422,
            detail="파일 크기가 10MB를 초과합니다.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=422,
            detail="빈 파일입니다.",
        )

    # 파이프라인 실행: 유형 판별 → OCR → 약품 조회
    image_type = classify_image(image_bytes)
    extracted_text = extract_text(image_bytes)
    matched_drugs = lookup_drugs(extracted_text)
    unmatched_candidates = extract_unmatched_names(extracted_text, matched_drugs)

    # 미매칭 후보를 식약처 API로 추가 조회
    api_matched: List[DrugInfo] = []
    still_unmatched: List[DrugInfo] = []
    for candidate in unmatched_candidates:
        info = fetch_drug_info(candidate.drug_name)
        if info:
            api_matched.append(info)
        else:
            still_unmatched.append(candidate)

    # 낱알 식별 파이프라인 (packaged_drug/unknown 때만)
    pill_identified: List[DrugInfo] = []
    if image_type in ("packaged_drug", "unknown"):
        from app.services.pill_identifier import identify_pills
        pill_features_list = identify_pills(image_bytes)
        for features in pill_features_list:
            results = fetch_drug_by_features(
                shape=features.shape,
                color1=features.color1,
                color2=features.color2,
                print_front=features.print_front,
            )
            pill_identified.extend(results)

    # 중복 제거 (약품명 기준) — pill_identified 포함
    seen: set = set()
    all_drugs: List[DrugInfo] = []
    for drug in matched_drugs + api_matched + still_unmatched + pill_identified:
        if drug.drug_name not in seen:
            seen.add(drug.drug_name)
            all_drugs.append(drug)

    all_matched = matched_drugs + api_matched

    # 경고 생성
    warnings: List[str] = []
    if not extracted_text and not pill_identified:
        warnings.append("텍스트를 추출하지 못했습니다. 이미지 품질을 확인해주세요.")
    if image_type == "unknown":
        warnings.append("이미지 유형을 판별할 수 없습니다.")
    if not all_matched and not pill_identified and extracted_text:
        warnings.append("등록된 약품 데이터와 일치하는 약품을 찾지 못했습니다.")

    data = AnalysisData(
        image_type=image_type,
        extracted_text=extracted_text,
        drugs=all_drugs,
        warnings=warnings,
    )

    return AnalysisResult(status="success", data=data)
