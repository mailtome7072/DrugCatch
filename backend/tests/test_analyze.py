import io
import sys
from pathlib import Path

import pytest

# backend 루트를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    """헬스체크 엔드포인트 200 반환"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_invalid_file_type():
    """지원하지 않는 파일 형식 → HTTP 422"""
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake content")
    response = client.post(
        "/analyze",
        files={"file": ("test.pdf", fake_pdf, "application/pdf")},
    )
    assert response.status_code == 422


def test_analyze_empty_file():
    """빈 파일 → HTTP 422"""
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/analyze",
        files={"file": ("empty.jpg", empty_file, "image/jpeg")},
    )
    assert response.status_code == 422


def _create_minimal_jpeg() -> bytes:
    """테스트용 최소 JPEG 이미지 생성 (1x1 흰색 픽셀)"""
    import struct
    import zlib

    # 최소 유효 JPEG (1x1 흰색)
    jpeg_bytes = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
        b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
        b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\x1e"
        b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00"
        b"\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b"
        b"\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04"
        b"\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa"
        b"\x07\"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br"
        b"\x82\t\n\x16\x17\x18\x19\x1a%&'()*456789:CDEFGHIJSTUVWXYZ"
        b"cdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95"
        b"\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3"
        b"\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca"
        b"\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7"
        b"\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa"
        b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xd7\xff\xd9"
    )
    return jpeg_bytes


# Tesseract 설치 여부 확인
try:
    import pytesseract
    pytesseract.get_tesseract_version()
    TESSERACT_AVAILABLE = True
except Exception:
    TESSERACT_AVAILABLE = False


@pytest.mark.skipif(not TESSERACT_AVAILABLE, reason="Tesseract OCR 미설치 환경")
def test_analyze_valid_image():
    """유효한 이미지 → HTTP 200 + AnalysisResult 구조"""
    jpeg_bytes = _create_minimal_jpeg()
    response = client.post(
        "/analyze",
        files={"file": ("test.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert "data" in body
    assert "image_type" in body["data"]
    assert "extracted_text" in body["data"]
    assert "drugs" in body["data"]
    assert "warnings" in body["data"]


def test_analyze_valid_image_without_tesseract():
    """Tesseract 없어도 API 응답 구조가 올바른지 확인"""
    jpeg_bytes = _create_minimal_jpeg()
    response = client.post(
        "/analyze",
        files={"file": ("test.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert "data" in body
