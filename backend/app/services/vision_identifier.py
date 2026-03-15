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
                                "이 이미지에서 보이는 약(의약품)을 분석해주세요.\n\n"
                                "각 알약에 대해 아래 형식으로 한 줄씩 출력하세요:\n"
                                "약품명: [제품명 또는 성분명]\n\n"
                                "규칙:\n"
                                "- 알약에 인쇄된 문자/숫자, 색상, 모양을 모두 활용하세요.\n"
                                "- 제품명을 모르면 성분명(예: 아세트아미노펜, 이부프로펜)으로 대체하세요.\n"
                                "- 성분명도 모르면 각인 문자(예: TA500, CE)를 그대로 출력하세요.\n"
                                "- 약이 전혀 없는 이미지면 아무것도 출력하지 마세요.\n"
                                "- 설명, 주의사항, 권고사항은 출력하지 마세요. 약품명 줄만 출력하세요."
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
                # 괄호 설명 제거: "ZC81 (분홍색 정제)" → "ZC81"
                import re
                name = re.sub(r"\s*[\(\（].*?[\)\）]", "", name).strip()
                # 식별 불가 항목 제외
                if name and "미상" not in name and "불명" not in name:
                    drug_names.append(name)

        return drug_names

    except Exception:
        return []
