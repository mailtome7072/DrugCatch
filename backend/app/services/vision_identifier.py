from __future__ import annotations

import base64
import os
from typing import List


def identify_drugs_from_image(image_bytes: bytes, media_type: str = "image/jpeg") -> List[str]:
    """
    Claude Vision API로 약품 이미지에서 약품명 추출.
    반환: 약품명 문자열 리스트 (식별 실패 또는 API 키 미설정 시 빈 리스트)
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return []

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)
        image_b64 = base64.standard_b64encode(image_bytes).decode("utf-8")

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": (
                                "이 이미지에서 의약품(약)을 식별해주세요.\n"
                                "각 약품에 대해 아래 형식으로 한 줄씩 나열해주세요.\n"
                                "약품명: [한글 또는 영문 제품명]\n\n"
                                "- 알약에 인쇄된 문자, 색상, 모양을 참고하세요.\n"
                                "- 정확히 식별 가능한 약품명만 나열하세요. 추측은 제외합니다.\n"
                                "- 약품을 전혀 식별할 수 없으면 아무것도 출력하지 마세요.\n"
                                "- 성분명(예: 아세트아미노펜)보다 제품명(예: 타이레놀)을 우선합니다."
                            ),
                        },
                    ],
                }
            ],
        )

        response_text = message.content[0].text
        drug_names: List[str] = []
        for line in response_text.splitlines():
            if "약품명:" in line:
                name = line.split("약품명:", 1)[1].strip().strip("[]").strip()
                if name:
                    drug_names.append(name)

        return drug_names

    except Exception:
        return []
