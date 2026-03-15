import io

import cv2
import numpy as np
import pytesseract
from PIL import Image


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """이미지 전처리: 흑백 변환 및 대비 강화"""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 흑백 변환
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # CLAHE로 대비 강화 (히스토그램 평활화)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # 이진화 (Otsu)
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return binary


def extract_text(image_bytes: bytes) -> str:
    """이미지에서 텍스트 추출 (한국어 + 영어)"""
    try:
        processed = preprocess_image(image_bytes)
        pil_image = Image.fromarray(processed)

        # 한국어 + 영어 OCR
        text = pytesseract.image_to_string(pil_image, lang="kor+eng")
        return text.strip()
    except pytesseract.TesseractNotFoundError:
        # Tesseract 미설치 환경 대응
        return ""
    except Exception:
        return ""
