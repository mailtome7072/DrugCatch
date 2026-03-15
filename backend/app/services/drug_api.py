from __future__ import annotations

import os
import re
from functools import lru_cache
from typing import Optional

import httpx

from app.models.schemas import DrugInfo

API_URL = "https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList"


def _get_api_key() -> str:
    key = os.environ.get("DRUG_API_KEY", "")
    if not key:
        raise RuntimeError("DRUG_API_KEY 환경변수가 설정되지 않았습니다.")
    return key


def _clean_html(text: str) -> str:
    """API 응답에 포함된 HTML 태그 제거"""
    return re.sub(r"<[^>]+>", "", text or "").strip()


def _normalize_drug_name(name: str) -> str:
    """약품명에서 용량/제형 접미사 제거해 검색용 이름 반환
    예: '아미세타정325' → '아미세타', '타이레놀정500mg' → '타이레놀'
    """
    # 숫자+단위 제거
    name = re.sub(r"\d+(\.\d+)?(mg|mcg|ml|g|%)?$", "", name, flags=re.IGNORECASE)
    # 제형 접미사 제거
    suffixes = ("정", "캡슐", "시럽", "주사액", "주사", "연고", "액제", "현탁액",
                "과립", "크림", "로션", "겔", "패치", "스프레이", "좌제", "앰플",
                "필름코팅정", "장용정", "서방정", "츄어블정")
    for s in sorted(suffixes, key=len, reverse=True):
        if name.endswith(s):
            name = name[: -len(s)]
            break
    return name.strip()


@lru_cache(maxsize=256)
def fetch_drug_info(drug_name: str) -> Optional[DrugInfo]:
    """
    식약처 의약품 개요 정보 API로 약품 정보 조회.
    검색 순서: 원본 이름 → 정규화 이름 (제형/용량 제거)
    결과 없으면 None 반환.
    """
    for query in dict.fromkeys([drug_name, _normalize_drug_name(drug_name)]):
        if not query:
            continue
        result = _call_api(query)
        if result:
            return result
    return None


def _call_api(item_name: str) -> Optional[DrugInfo]:
    """API 단건 호출"""
    try:
        resp = httpx.get(
            API_URL,
            params={
                "serviceKey": _get_api_key(),
                "itemName": item_name,
                "type": "json",
                "numOfRows": 1,
                "pageNo": 1,
            },
            timeout=5.0,
        )
        resp.raise_for_status()
        body = resp.json()

        items = (
            body.get("body", {}).get("items") or []
        )
        if not items:
            return None

        item = items[0]
        return DrugInfo(
            drug_name=item.get("itemName", item_name),
            generic_name=item.get("material", ""),
            usage=_clean_html(item.get("efcyQesitm", "")),
            dosage=_clean_html(item.get("useMethodQesitm", "")),
            caution=_clean_html(item.get("atpnQesitm", "")),
            matched=True,
            image_url=item.get("itemImage") or None,
        )

    except Exception:
        return None
