"""drug_api.py 단위 테스트"""
from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.drug_api import fetch_drug_by_features, fetch_drug_info


def _mock_response(body: dict, status_code: int = 200):
    """httpx.get mock 헬퍼"""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.json.return_value = body
    mock_resp.raise_for_status = MagicMock()
    return mock_resp


class TestFetchDrugInfo:
    def setup_method(self):
        fetch_drug_info.cache_clear()
        fetch_drug_by_features.cache_clear()

    def test_returns_drug_info_on_valid_response(self):
        """정상 API 응답 → DrugInfo 반환"""
        body = {
            "body": {
                "items": [{
                    "itemName": "타이레놀정500밀리그램",
                    "material": "아세트아미노펜",
                    "efcyQesitm": "두통, 발열에 사용",
                    "useMethodQesitm": "1회 1~2정 복용",
                    "atpnQesitm": "간 질환자 주의",
                    "itemImage": "http://example.com/img.jpg",
                }]
            }
        }
        with patch.dict(os.environ, {"DRUG_API_KEY": "test-key"}):
            with patch("app.services.drug_api.httpx.get", return_value=_mock_response(body)):
                result = fetch_drug_info("타이레놀")
        assert result is not None
        assert result.drug_name == "타이레놀정500밀리그램"
        assert result.matched is True
        assert result.image_url == "http://example.com/img.jpg"

    def test_returns_none_when_items_empty(self):
        """items 빈 배열 → None 반환"""
        body = {"body": {"items": []}}
        with patch.dict(os.environ, {"DRUG_API_KEY": "test-key"}):
            with patch("app.services.drug_api.httpx.get", return_value=_mock_response(body)):
                result = fetch_drug_info("존재하지않는약")
        assert result is None

    def test_returns_none_on_network_error(self):
        """네트워크 예외 → None 반환"""
        with patch.dict(os.environ, {"DRUG_API_KEY": "test-key"}):
            with patch("app.services.drug_api.httpx.get", side_effect=Exception("timeout")):
                result = fetch_drug_info("타이레놀")
        assert result is None


class TestFetchDrugByFeatures:
    def setup_method(self):
        fetch_drug_info.cache_clear()
        fetch_drug_by_features.cache_clear()

    def test_returns_empty_when_print_front_too_short(self):
        """print_front 길이 < 2 → 빈 리스트"""
        assert fetch_drug_by_features("원형", "하양", print_front="") == []
        assert fetch_drug_by_features("원형", "하양", print_front="A") == []

    def test_returns_drug_list_on_valid_response(self):
        """정상 API 응답 → DrugInfo 리스트 반환"""
        body = {
            "body": {
                "items": [{
                    "ITEM_NAME": "세파드린캡슐",
                    "CLASS_NAME": "항생제",
                    "DRUG_SHAPE": "장방형",
                    "COLOR_CLASS1": "파랑",
                    "ITEM_IMAGE": "http://example.com/pill.jpg",
                }]
            }
        }
        with patch.dict(os.environ, {"DRUG_API_KEY": "test-key"}):
            with patch("app.services.drug_api.httpx.get", return_value=_mock_response(body)):
                result = fetch_drug_by_features("장방형", "파랑", print_front="CE")
        assert len(result) == 1
        assert result[0].drug_name == "세파드린캡슐"
        assert result[0].matched is True

    def test_filters_by_shape(self):
        """shape 불일치 항목 필터링"""
        body = {
            "body": {
                "items": [{
                    "ITEM_NAME": "테스트약",
                    "CLASS_NAME": "",
                    "DRUG_SHAPE": "원형",     # 요청한 shape=장방형 과 불일치
                    "COLOR_CLASS1": "하양",
                    "ITEM_IMAGE": None,
                }]
            }
        }
        with patch.dict(os.environ, {"DRUG_API_KEY": "test-key"}):
            with patch("app.services.drug_api.httpx.get", return_value=_mock_response(body)):
                result = fetch_drug_by_features("장방형", "하양", print_front="TA")
        assert result == []

    def test_filters_by_color(self):
        """color 불일치 항목 필터링"""
        body = {
            "body": {
                "items": [{
                    "ITEM_NAME": "테스트약",
                    "CLASS_NAME": "",
                    "DRUG_SHAPE": "원형",
                    "COLOR_CLASS1": "빨강",   # 요청한 color1=하양 과 불일치
                    "ITEM_IMAGE": None,
                }]
            }
        }
        with patch.dict(os.environ, {"DRUG_API_KEY": "test-key"}):
            with patch("app.services.drug_api.httpx.get", return_value=_mock_response(body)):
                result = fetch_drug_by_features("원형", "하양", print_front="TA")
        assert result == []

    def test_returns_empty_on_api_error(self):
        """API 예외 → 빈 리스트"""
        with patch.dict(os.environ, {"DRUG_API_KEY": "test-key"}):
            with patch("app.services.drug_api.httpx.get", side_effect=Exception("error")):
                result = fetch_drug_by_features("원형", "하양", print_front="TA")
        assert result == []
