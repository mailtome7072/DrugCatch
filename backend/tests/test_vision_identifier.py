"""vision_identifier.py 단위 테스트"""
from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# anthropic 패키지가 로컬에 설치되지 않은 환경을 위해 sys.modules에 mock 주입
_mock_anthropic_module = MagicMock()
sys.modules.setdefault("anthropic", _mock_anthropic_module)

from app.services.vision_identifier import identify_drugs_from_image

DUMMY_IMAGE = b"\xff\xd8\xff\xe0" + b"\x00" * 100  # JPEG 매직 바이트 포함 더미


def _mock_anthropic_client(response_text: str):
    """anthropic 클라이언트 mock 헬퍼"""
    mock_client = MagicMock()
    mock_msg = MagicMock()
    mock_msg.content = [MagicMock(text=response_text)]
    mock_client.messages.create.return_value = mock_msg
    return mock_client


class TestIdentifyDrugsFromImage:
    def test_returns_empty_when_api_key_not_set(self):
        """ANTHROPIC_API_KEY 미설정 시 빈 리스트 반환"""
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": ""}):
            result = identify_drugs_from_image(DUMMY_IMAGE)
        assert result == []

    def test_parses_single_drug_name(self):
        """단일 약품명 정상 파싱"""
        response = "약품명: 타이레놀"
        mock_client = _mock_anthropic_client(response)
        sys.modules["anthropic"].Anthropic.return_value = mock_client
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-test"}):
            result = identify_drugs_from_image(DUMMY_IMAGE)
        assert result == ["타이레놀"]

    def test_parses_multiple_drug_names(self):
        """여러 약품명 파싱"""
        response = "약품명: 타이레놀\n약품명: 아스피린"
        mock_client = _mock_anthropic_client(response)
        sys.modules["anthropic"].Anthropic.return_value = mock_client
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-test"}):
            result = identify_drugs_from_image(DUMMY_IMAGE)
        assert result == ["타이레놀", "아스피린"]

    def test_removes_parenthetical_description(self):
        """괄호 설명 제거: 'ZC81 (분홍색 정제)' → 'ZC81'"""
        response = "약품명: ZC81 (분홍색 정제)"
        mock_client = _mock_anthropic_client(response)
        sys.modules["anthropic"].Anthropic.return_value = mock_client
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-test"}):
            result = identify_drugs_from_image(DUMMY_IMAGE)
        assert result == ["ZC81"]

    def test_filters_out_misant_names(self):
        """'미상' 포함 항목 필터링"""
        response = "약품명: 제품명 미상\n약품명: 타이레놀"
        mock_client = _mock_anthropic_client(response)
        sys.modules["anthropic"].Anthropic.return_value = mock_client
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-test"}):
            result = identify_drugs_from_image(DUMMY_IMAGE)
        assert result == ["타이레놀"]

    def test_filters_out_unknown_names(self):
        """'불명' 포함 항목 필터링"""
        response = "약품명: 성분 불명"
        mock_client = _mock_anthropic_client(response)
        sys.modules["anthropic"].Anthropic.return_value = mock_client
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-test"}):
            result = identify_drugs_from_image(DUMMY_IMAGE)
        assert result == []

    def test_returns_empty_on_api_exception(self):
        """API 예외 발생 시 빈 리스트 반환 (graceful fallback)"""
        sys.modules["anthropic"].Anthropic.side_effect = Exception("connection error")
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-test"}):
            result = identify_drugs_from_image(DUMMY_IMAGE)
        assert result == []
        # side_effect 초기화
        sys.modules["anthropic"].Anthropic.side_effect = None

    def test_returns_empty_when_no_drug_name_lines(self):
        """'약품명:' 없는 응답 → 빈 리스트"""
        response = "이미지에서 약품을 식별할 수 없습니다."
        mock_client = _mock_anthropic_client(response)
        sys.modules["anthropic"].Anthropic.return_value = mock_client
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-test"}):
            result = identify_drugs_from_image(DUMMY_IMAGE)
        assert result == []
