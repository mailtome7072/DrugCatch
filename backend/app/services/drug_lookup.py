from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import List, Set

from app.models.schemas import DrugInfo

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "drugs.json"


@lru_cache(maxsize=1)
def _load_drugs() -> List[dict]:
    """약품 데이터 메모리 캐시 로드"""
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


def lookup_drugs(text: str) -> List[DrugInfo]:
    """
    OCR 텍스트에서 약품명 매칭
    - 정규표현식으로 약품명/일반명 검색
    - 미매칭 약품도 matched=False로 포함
    """
    drugs_db = _load_drugs()
    results: List[DrugInfo] = []
    matched_names: Set[str] = set()

    # 텍스트 정규화 (공백/특수문자 정리)
    normalized_text = re.sub(r"[\s\-_]+", " ", text).lower()

    for drug in drugs_db:
        drug_name = drug["drug_name"]
        generic_name = drug["generic_name"]

        # 약품명 또는 일반명이 텍스트에 포함되는지 확인
        name_pattern = re.escape(drug_name.lower())
        generic_pattern = re.escape(generic_name.lower())

        is_matched = bool(
            re.search(name_pattern, normalized_text)
            or re.search(generic_pattern, normalized_text)
        )

        # 중복 약품명 스킵 (같은 generic_name의 상품명/일반명 중복 방지)
        dedup_key = f"{drug_name}:{generic_name}"
        if dedup_key in matched_names:
            continue

        if is_matched:
            matched_names.add(dedup_key)
            results.append(DrugInfo(
                drug_name=drug_name,
                generic_name=generic_name,
                usage=drug["usage"],
                caution=drug["caution"],
                dosage=drug["dosage"],
                matched=True,
            ))

    return results


def extract_unmatched_names(text: str, matched_drugs: List[DrugInfo]) -> List[DrugInfo]:
    """
    OCR 텍스트에서 매칭되지 않은 약품명 후보 추출.
    약품명으로 판단되는 단어만 포함:
      1) 약품 종류 접미사 보유 (정·캡슐·시럽 등)
      2) 한글+숫자/영어 혼합 패턴 (타이레놀500mg 계열)
    """
    matched_names_lower = {d.drug_name.lower() for d in matched_drugs}

    # 약품 종류를 나타내는 접미사
    DRUG_SUFFIXES = (
        "정", "캡슐", "시럽", "주사", "주사액", "연고", "액제", "현탁액",
        "과립", "산", "환", "크림", "로션", "겔", "패치", "스프레이",
        "흡입제", "점안액", "점이액", "좌제", "앰플",
    )

    # 약품명이 아닌 것이 확실한 단어 목록
    NON_DRUG_WORDS: Set[str] = {
        "처방전", "처방", "조제", "병원", "의원", "클리닉", "환자", "의사",
        "약국", "약사", "복용", "복약", "지시", "사항", "이름", "성명",
        "나이", "성별", "날짜", "생년월일", "진료", "진단", "보험", "주소",
        "전화", "연락처", "담당", "서명", "용법", "용량", "주의", "부작용",
        "효능", "효과", "보관", "유효", "기간", "제조", "수입", "허가",
        "식약처", "건강", "보험증", "차수", "일분", "일회", "하루", "매일",
        "아침", "점심", "저녁", "식전", "식후", "취침", "전", "후",
        "주민", "등록", "번호", "발행", "조제일", "투약", "기간",
        "내과", "외과", "소아과", "이비인후과", "피부과", "정형외과",
    }

    unmatched: List[DrugInfo] = []
    seen: Set[str] = set()

    # 패턴 1: 약품 접미사로 끝나는 한글 단어 (예: 타이레놀정, 아목시린캡슐)
    for suffix in DRUG_SUFFIXES:
        pattern = rf"[가-힣A-Za-z0-9]{{1,15}}{re.escape(suffix)}"
        for m in re.finditer(pattern, text):
            word = m.group()
            key = word.lower()
            if key not in matched_names_lower and word not in seen and word not in NON_DRUG_WORDS:
                seen.add(word)
                unmatched.append(DrugInfo(
                    drug_name=word,
                    generic_name="",
                    usage="",
                    caution="",
                    dosage="",
                    matched=False,
                ))

    # 패턴 2: 한글+숫자/영어 혼합 단어 (예: 타이레놀500, 세파클러250)
    for m in re.finditer(r"[가-힣]{2,8}[0-9]+(?:mg|mcg|ml|g)?", text, re.IGNORECASE):
        word = m.group()
        key = word.lower()
        if key not in matched_names_lower and word not in seen and word not in NON_DRUG_WORDS:
            seen.add(word)
            unmatched.append(DrugInfo(
                drug_name=word,
                generic_name="",
                usage="",
                caution="",
                dosage="",
                matched=False,
            ))

    return unmatched[:5]  # 최대 5개
