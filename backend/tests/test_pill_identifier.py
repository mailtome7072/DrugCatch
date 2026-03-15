"""pill_identifier.py 단위 테스트"""
from __future__ import annotations

import os
import sys
from unittest.mock import patch

import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.pill_identifier import (
    _classify_shape,
    _map_hsv_to_color_name,
    identify_pills,
)


def _make_pill_image() -> bytes:
    """흰 배경에 원형 알약이 있는 합성 이미지 생성"""
    import cv2
    img = np.ones((200, 200, 3), dtype=np.uint8) * 255  # 흰 배경
    cv2.circle(img, (100, 100), 40, (180, 100, 200), -1)  # 분홍 원
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


def _make_contour(ratio: float) -> np.ndarray:
    """주어진 aspect ratio의 타원형 컨투어 생성"""
    import cv2
    img = np.zeros((300, 300), dtype=np.uint8)
    w = 100
    h = int(w / ratio)
    cv2.ellipse(img, (150, 150), (w // 2, h // 2), 0, 0, 360, 255, -1)
    contours, _ = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return contours[0]


class TestIdentifyPills:
    def test_returns_empty_for_invalid_bytes(self):
        """유효하지 않은 이미지 바이트 → 빈 리스트"""
        result = identify_pills(b"not_an_image")
        assert result == []

    def test_returns_empty_for_empty_bytes(self):
        """빈 바이트 → 빈 리스트"""
        result = identify_pills(b"")
        assert result == []

    def test_returns_empty_when_imdecode_fails(self):
        """cv2.imdecode None 반환 시 빈 리스트"""
        with patch("app.services.pill_identifier.cv2.imdecode", return_value=None):
            result = identify_pills(b"\x00" * 100)
        assert result == []

    def test_returns_pill_features_for_valid_image(self):
        """정상 이미지 → PillFeatures 리스트 반환"""
        image_bytes = _make_pill_image()
        result = identify_pills(image_bytes)
        assert isinstance(result, list)
        if result:
            feat = result[0]
            assert feat.shape in ("원형", "타원형", "장방형")
            assert isinstance(feat.color1, str)
            assert feat.color2 is None or isinstance(feat.color2, str)
            assert isinstance(feat.print_front, str)


class TestClassifyShape:
    def test_circle(self):
        """ratio < 1.2 → 원형"""
        contour = _make_contour(1.0)
        assert _classify_shape(contour) == "원형"

    def test_oval(self):
        """1.2 ≤ ratio < 1.8 → 타원형"""
        contour = _make_contour(1.5)
        assert _classify_shape(contour) == "타원형"

    def test_rectangle(self):
        """ratio ≥ 1.8 → 장방형"""
        contour = _make_contour(2.5)
        assert _classify_shape(contour) == "장방형"


class TestMapHsvToColorName:
    # 무채색
    def test_white(self):
        assert _map_hsv_to_color_name(0, 10, 230) == "하양"

    def test_black(self):
        assert _map_hsv_to_color_name(0, 10, 50) == "검정"

    def test_gray(self):
        assert _map_hsv_to_color_name(0, 10, 130) == "회색"

    # 유채색
    def test_red_low_h(self):
        assert _map_hsv_to_color_name(5, 200, 200) == "빨강"

    def test_red_high_h(self):
        assert _map_hsv_to_color_name(170, 200, 200) == "빨강"

    def test_orange(self):
        assert _map_hsv_to_color_name(15, 200, 200) == "주황"

    def test_yellow(self):
        assert _map_hsv_to_color_name(25, 200, 200) == "노랑"

    def test_green(self):
        assert _map_hsv_to_color_name(60, 200, 200) == "초록"

    def test_blue(self):
        assert _map_hsv_to_color_name(115, 200, 200) == "파랑"

    def test_purple(self):
        assert _map_hsv_to_color_name(150, 200, 200) == "보라"

    def test_brown(self):
        """낮은 채도/명도 → 갈색"""
        assert _map_hsv_to_color_name(40, 100, 130) == "갈색"

    def test_light_green(self):
        """높은 채도/명도 → 연두"""
        assert _map_hsv_to_color_name(40, 200, 200) == "연두"
