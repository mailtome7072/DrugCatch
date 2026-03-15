from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, UploadFile

from app.models.schemas import AnalysisData, AnalysisResult
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
    unmatched_drugs = extract_unmatched_names(extracted_text, matched_drugs)

    all_drugs = matched_drugs + unmatched_drugs

    # 경고 생성
    warnings: List[str] = []
    if not extracted_text:
        warnings.append("텍스트를 추출하지 못했습니다. 이미지 품질을 확인해주세요.")
    if image_type == "unknown":
        warnings.append("이미지 유형을 판별할 수 없습니다.")
    if not matched_drugs and extracted_text:
        warnings.append("등록된 약품 데이터와 일치하는 약품을 찾지 못했습니다.")

    data = AnalysisData(
        image_type=image_type,
        extracted_text=extracted_text,
        drugs=all_drugs,
        warnings=warnings,
    )

    return AnalysisResult(status="success", data=data)
