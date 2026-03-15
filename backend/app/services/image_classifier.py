from typing import Literal

import cv2
import numpy as np


def classify_image(image_bytes: bytes) -> Literal["prescription", "packaged_drug", "unknown"]:
    """
    OpenCV 휴리스틱으로 이미지 유형 판별
    - prescription: 처방전 (흰 배경, 높은 텍스트 밀도)
    - packaged_drug: 약품 포장 (색상 다양, 중간 텍스트)
    - unknown: 판별 불가
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return "unknown"

    h, w = img.shape[:2]
    total_pixels = h * w

    # 1. 흰색 배경 비율 계산 (처방전 특징)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    white_mask = cv2.inRange(hsv, (0, 0, 200), (180, 30, 255))
    white_ratio = np.sum(white_mask > 0) / total_pixels

    # 2. 텍스트 밀도 계산 (엣지 감지)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    text_density = np.sum(edges > 0) / total_pixels

    # 3. 색상 다양성 (표준편차)
    color_std = float(np.std(img))

    # 판별 로직
    if white_ratio > 0.5 and text_density > 0.05:
        # 흰 배경 + 높은 텍스트 밀도 → 처방전
        return "prescription"
    elif color_std > 40 and text_density > 0.02:
        # 색상 다양 + 중간 텍스트 밀도 → 포장 약품
        return "packaged_drug"
    elif white_ratio > 0.3 and text_density > 0.03:
        # 흰 배경 + 어느정도 텍스트 밀도 → 처방전 가능성
        return "prescription"
    else:
        return "unknown"
