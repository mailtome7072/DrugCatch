from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import cv2
import numpy as np

try:
    import pytesseract
    _TESSERACT_AVAILABLE = True
except ImportError:
    _TESSERACT_AVAILABLE = False


@dataclass
class PillFeatures:
    shape: str            # "원형", "타원형", "장방형" 등
    color1: str           # 주요 색상 (dominant)
    color2: Optional[str] # 이색 알약 두 번째 색 (없으면 None)
    print_front: str      # 앞면 식별문자 (OCR 결과, 없으면 "")


def identify_pills(image_bytes: bytes) -> List[PillFeatures]:
    """이미지에서 알약 특징(모양, 색상, 식별문자) 추출"""
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []

        # 가우시안 블러로 노이즈 제거
        blurred = cv2.GaussianBlur(img, (5, 5), 0)
        hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)

        contours = _detect_pill_contours(blurred)
        if not contours:
            return []

        results: List[PillFeatures] = []
        # 면적 내림차순 정렬 후 최대 10개 처리
        contours_sorted = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

        for contour in contours_sorted:
            area = cv2.contourArea(contour)
            if area < 500:
                continue

            # ROI 추출
            x, y, w, h = cv2.boundingRect(contour)
            roi_hsv = hsv[y:y+h, x:x+w]
            roi_gray = cv2.cvtColor(blurred[y:y+h, x:x+w], cv2.COLOR_BGR2GRAY)

            shape = _classify_shape(contour)
            color1, color2 = _extract_dominant_colors(roi_hsv)
            text = _extract_pill_text(roi_gray)

            results.append(PillFeatures(
                shape=shape,
                color1=color1,
                color2=color2,
                print_front=text,
            ))

        return results
    except Exception:
        return []


def _detect_pill_contours(img: np.ndarray) -> List[np.ndarray]:
    """배경 제외 마스크로 알약 윤곽선 검출"""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # 흰색 배경 마스크
    white_mask = cv2.inRange(hsv, (0, 0, 200), (180, 30, 255))
    # 검은색 배경 마스크
    black_mask = cv2.inRange(hsv, (0, 0, 0), (180, 255, 50))
    # 회색 배경 마스크
    gray_mask = cv2.inRange(hsv, (0, 0, 100), (180, 30, 200))

    bg_mask = cv2.bitwise_or(white_mask, cv2.bitwise_or(black_mask, gray_mask))
    fg_mask = cv2.bitwise_not(bg_mask)

    # 노이즈 제거
    kernel = np.ones((5, 5), np.uint8)
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return list(contours)


def _classify_shape(contour: np.ndarray) -> str:
    """컨투어 aspect ratio로 모양 분류"""
    if len(contour) < 5:
        x, y, w, h = cv2.boundingRect(contour)
        ratio = w / h if h > 0 else 1.0
    else:
        try:
            ellipse = cv2.fitEllipse(contour)
            _, axes, _ = ellipse
            ratio = max(axes) / min(axes) if min(axes) > 0 else 1.0
        except Exception:
            x, y, w, h = cv2.boundingRect(contour)
            ratio = max(w, h) / min(w, h) if min(w, h) > 0 else 1.0

    if ratio < 1.2:
        return "원형"
    elif ratio < 1.8:
        return "타원형"
    else:
        return "장방형"


def _extract_dominant_colors(roi_hsv: np.ndarray) -> tuple[str, Optional[str]]:
    """HSV ROI에서 주요 색상 1~2개 추출"""
    if roi_hsv.size == 0:
        return "하양", None

    # 히스토그램으로 H 채널 분포 분석
    h_channel = roi_hsv[:, :, 0].flatten()
    s_channel = roi_hsv[:, :, 1].flatten()
    v_channel = roi_hsv[:, :, 2].flatten()

    # 채도가 낮은 픽셀 (무채색) 필터링
    chromatic = s_channel > 30

    if np.sum(chromatic) < 10:
        # 무채색 이미지 → v값으로 결정
        mean_v = np.mean(v_channel)
        if mean_v > 200:
            return "하양", None
        elif mean_v < 80:
            return "검정", None
        else:
            return "회색", None

    h_chromatic = h_channel[chromatic]
    v_chromatic = v_channel[chromatic]

    # H값으로 색상 분류 (k-means 없이 간단한 히스토그램)
    color1 = _map_hsv_to_color_name(
        float(np.median(h_chromatic)),
        float(np.median(s_channel[chromatic])),
        float(np.median(v_chromatic)),
    )

    # 두 번째 색상 확인 (이색 알약 여부)
    color2: Optional[str] = None
    h_hist, _ = np.histogram(h_chromatic, bins=18, range=(0, 180))
    top2 = np.argsort(h_hist)[-2:]
    if h_hist[top2[0]] > 10 and h_hist[top2[1]] > 10:
        h2 = float(top2[0] * 10 + 5)
        color2_candidate = _map_hsv_to_color_name(h2, 100, 150)
        if color2_candidate != color1:
            color2 = color2_candidate

    return color1, color2


def _extract_dominant_color(roi_hsv: np.ndarray) -> str:
    """단일 주요 색상 반환 (하위 호환용)"""
    color1, _ = _extract_dominant_colors(roi_hsv)
    return color1


def _extract_pill_text(roi_gray: np.ndarray) -> str:
    """알약 ROI에서 식별문자 OCR 추출"""
    if not _TESSERACT_AVAILABLE:
        return ""
    try:
        # CLAHE 대비 강화
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(roi_gray)
        # Otsu 이진화
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # 영문+숫자 식별문자 추출 (psm 8: 단일 단어)
        config = "--psm 8 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        from PIL import Image
        pil_img = Image.fromarray(binary)
        text = pytesseract.image_to_string(pil_img, config=config)
        return text.strip()
    except Exception:
        return ""


def _map_hsv_to_color_name(h: float, s: float, v: float) -> str:
    """HSV 값을 식약처 낱알식별 API 색상명으로 매핑"""
    # 무채색 판단
    if s < 30:
        if v > 200:
            return "하양"
        elif v < 80:
            return "검정"
        else:
            return "회색"

    # 유채색 — H값 기준 (0~180 범위, OpenCV 기준)
    if h < 10 or h >= 160:
        return "빨강"
    elif h < 20:
        return "주황"
    elif h < 35:
        return "노랑"
    elif h < 75:
        return "초록"
    elif h < 85:
        return "청록"
    elif h < 130:
        return "파랑"
    elif h < 145:
        return "남색"
    elif h < 160:
        return "보라"
    else:
        return "분홍"
