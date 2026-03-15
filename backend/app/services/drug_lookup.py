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
    OCR 텍스트에서 매칭되지 않은 약품명 후보 추출
    (한글 단어 중 약품명처럼 보이는 것)
    """
    matched_names_lower = {d.drug_name.lower() for d in matched_drugs}

    # 한글 단어 추출 (2-10자)
    korean_words = re.findall(r"[가-힣]{2,10}", text)

    unmatched: List[DrugInfo] = []
    seen: Set[str] = set()

    for word in korean_words:
        if word.lower() not in matched_names_lower and word not in seen:
            seen.add(word)
            # 약품명일 가능성이 있는 단어만 포함 (일반 조사/접속사 필터)
            common_words = {"처방전", "병원", "환자", "의사", "약국", "복용", "복약", "지시", "사항",
                           "이름", "나이", "성별", "날짜", "진료", "의원", "클리닉"}
            if word not in common_words:
                unmatched.append(DrugInfo(
                    drug_name=word,
                    generic_name="",
                    usage="",
                    caution="",
                    dosage="",
                    matched=False,
                ))

    return unmatched[:5]  # 최대 5개
