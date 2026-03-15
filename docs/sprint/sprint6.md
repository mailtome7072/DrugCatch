# Sprint 6 — Claude Vision API 연동으로 알약 이미지 직접 분석

**기간**: 2026-03-15
**브랜치**: `sprint6`
**상태**: 완료 (2026-03-15)

---

## 목표

Sprint 5에서 실패한 식약처 낱알식별 API 방식을 대체하여, 알약 직접 촬영 이미지(packaged_drug / unknown)에서
Claude Vision API로 약품명을 추출하고 식약처 의약품 개요 API로 DrugInfo를 구성합니다.

---

## 배경 및 실패 원인

Sprint 5에서 OpenCV + pytesseract + 식약처 낱알식별 API(v03)로 알약 식별을 시도했으나 다음 이유로 실패:

- v03 API는 `item_name`(약품명) 파라미터만 지원 — `print_front`/`drug_shape`/`color_class1` 파라미터 무시, 전체 25,380건 반환
- v01은 영구 중단, v02는 404
- 알약 이미지에서 식별문자(print_front) OCR 자체가 저화질/각도 문제로 실패 빈번

**해결 방향**: Claude Vision API의 멀티모달 이미지 이해 능력을 활용하여 약품명을 직접 추출합니다.

---

## 구현 범위

### 포함

- Claude Vision API 호출 서비스 모듈 신규 생성 (`vision_identifier.py`)
- `analyze.py`의 낱알 파이프라인을 Vision 파이프라인으로 교체
- `anthropic` 패키지 의존성 추가
- `docker/backend/Dockerfile.prod` — `libgl1-mesa-glx` → `libgl1` (Debian trixie 호환 수정)

### 제외

- `pill_identifier.py` 삭제 (유지 — 향후 재활용 가능성)
- 프론트엔드 변경 (API 응답 스키마 동일)
- 식약처 낱알식별 API 추가 개선

---

## 변경 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `backend/app/services/vision_identifier.py` | 신규 | Claude Vision(haiku)으로 알약 이미지에서 약품명 추출. 괄호 설명 제거, 미상/불명 항목 필터링 |
| `backend/app/routers/analyze.py` | 수정 | pill_identifier(OpenCV) 파이프라인 → vision_identifier로 교체. 디버그 로그 전체 제거 |
| `backend/requirements.txt` | 수정 | `anthropic>=0.40.0` 추가 |
| `docker/backend/Dockerfile.prod` | 수정 | `libgl1-mesa-glx` → `libgl1` (Debian trixie 호환) |

---

## 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 모델 | `claude-haiku-4-5-20251001` | 빠른 응답, 저비용, 이미지 분석 충분 |
| 프롬프트 전략 | 제품명 → 성분명 → 각인문자 순서 대체 출력 유도 | 식별 실패 시에도 유용한 정보 반환 |
| 응답 파싱 | 줄 단위 텍스트 파싱 (JSON 강제 지양) | JSON 형식 불안정 시 파싱 오류 방지 |
| 미매칭 처리 | `DrugInfo(matched=False)` 생성 | 사용자가 Claude 식별 결과를 직접 확인 가능 |
| API 키 미설정 | 빈 리스트 반환 (graceful fallback) | 환경변수 없는 환경에서도 앱 정상 동작 |

---

## 파이프라인 변경 내용

```
# 변경 전 (Sprint 5)
packaged_drug/unknown → identify_pills() → fetch_drug_by_features()

# 변경 후 (Sprint 6)
packaged_drug/unknown → identify_drugs_from_image() → fetch_drug_info()
```

---

## 테스트 결과

- 알약.jpg 테스트: "ZC81" 각인 감지, 식약처 DB 미등록 약품으로 matched=False 반환 (정상 동작)
- 한국 식약처 DB에 없는 외국 약품 각인의 경우 matched=False로 표시됨
- pytest 5개 통과 (회귀 없음)

---

## 한계 및 주의사항

- **식약처 DB 미등록 약품**: 외국 제조 의약품 또는 한국 미등록 약품은 matched=False로만 표시됨
- **ANTHROPIC_API_KEY 필수**: 키 미설정 시 알약 직접 촬영 이미지에서 약품 0건 반환 (graceful fallback)
- **API 호출 비용**: Haiku 모델 기준 이미지 1장당 약 $0.0008 이하 (요청당 비용 발생)
- **응답 지연**: Claude API 호출로 인해 처방전 이미지 대비 응답 시간 증가 가능 (프론트엔드 로딩 인디케이터 이미 구현됨)
- **`import re` 위치**: `vision_identifier.py` 내 루프 안에서 import — 동작에는 무관하나 추후 최상단 이동 권장 (코드 리뷰 Medium 이슈)
- **`vision_identifier.py` 단위 테스트 없음**: 외부 API 의존으로 mock 없이 테스트 어려움 — 추후 Sprint에서 mock 기반 단위 테스트 추가 권장

---

## 완료 기준 달성

- ✅ 알약 이미지 업로드 시 약품명 추출 동작 (이전: 0건 → 이후: 각인 기반 결과 반환)
- ✅ `ANTHROPIC_API_KEY` 미설정 시 graceful fallback (오류 없이 빈 리스트 반환)
- ✅ pytest 5개 통과 (회귀 없음)
- ✅ 기존 디버그 로그(`[DEBUG]`) 전체 제거
- ✅ `backend/requirements.txt`에 `anthropic>=0.40.0` 추가
- ✅ Docker 빌드 오류(`libgl1-mesa-glx`) 수정

---

## 검증 결과

### 자동 검증 (2026-03-15)

- ✅ `pytest backend/tests/ -v` — 5개 통과 (test_health, test_analyze_invalid_file_type, test_analyze_empty_file, test_analyze_valid_image, test_analyze_valid_image_without_tesseract)

### 수동 검증 필요

- ⬜ `docker compose up --build` 프론트엔드 + 백엔드 통합 기동 확인
- ⬜ 알약 이미지 업로드 후 Vision API 결과 카드 표시 확인 (`ANTHROPIC_API_KEY` 설정 후)
- ⬜ `ANTHROPIC_API_KEY` 미설정 환경에서 graceful fallback 동작 확인
- ⬜ UI 디자인 시각적 품질 확인 (모바일 375px 포함)

---

## 회고 (Retrospective)

### 잘 된 점 (Keep)
- Sprint 5의 실패(식약처 낱알식별 API 폐지)에 빠르게 대응하여 Claude Vision API라는 대안을 찾고 같은 날 구현을 완료했다. 장애 대응 속도가 빨랐다.
- `ANTHROPIC_API_KEY` 미설정 환경에서 빈 리스트를 반환하는 graceful fallback 설계가 Sprint 7 단위 테스트에서 T1-1 케이스로 그대로 활용되었다.
- 줄 단위 텍스트 파싱 방식(JSON 강제 지양)을 선택하여 Claude API 응답이 JSON 형식이 아닐 때 파싱 오류가 발생하지 않도록 처리했다.
- `claude-haiku-4-5` 모델 선택이 응답 속도와 비용 측면에서 알약 이미지 분석에 적합했다. 이미지 1장당 $0.0008 이하의 비용은 MVP 운영에 현실적이었다.
- `libgl1-mesa-glx` → `libgl1` Docker 빌드 오류를 Debian trixie 호환 패키지로 수정하여 CI 빌드 블로커를 해소했다.

### 문제점 (Problem)
- `vision_identifier.py` 내 루프 안에서 `import re`를 호출하는 코드 스타일 문제가 코드 리뷰에서 발견되었다. 기능상 문제는 없으나 Python 관례 위반이었다.
- Claude Vision API가 한국 식약처 DB에 없는 외국 약품을 반환하는 경우 `matched=False`로만 표시되어 사용자에게 "식별은 했으나 DB 미등록" 상태를 명확히 전달하지 못했다.
- `vision_identifier.py` 단위 테스트가 외부 API 의존성 때문에 Sprint 6에서 작성되지 않았고 Sprint 7에서 mock 기반으로 소급 추가해야 했다.
- `pill_identifier.py`를 삭제하지 않고 유지(재활용 가능성)한 결정이 코드베이스에 사용되지 않는 모듈을 남겼다.

### 개선 방향 (Try)
- 외부 API 의존 서비스 모듈을 작성할 때 mock 기반 단위 테스트를 같은 스프린트 내에 함께 작성한다.
- Claude API 응답에서 `matched=False` 결과를 사용자에게 "AI가 식별했으나 국내 DB 미등록" 메시지로 명확히 구분하여 표시하는 UI 개선을 다음 스프린트에 반영한다.
- `import` 문은 항상 파일 최상단에 배치하는 Python 관례(PEP 8)를 린터(flake8/ruff)로 자동 강제한다.

### 핵심 학습 (Key Learnings)
- Claude Vision API의 멀티모달 이미지 이해 능력은 낮은 화질이나 각도 변형에서도 알약 식별문자를 인식할 수 있어, OpenCV contour + pytesseract 조합보다 알약 이미지 분석에 훨씬 효과적이었다.
- 외부 API 기반 기능을 구현할 때 "API 키 미설정 → graceful fallback" 패턴을 처음부터 설계하면, 다양한 배포 환경(키 없는 테스트 환경, 키 있는 프로덕션 환경)에서 동일한 코드가 안정적으로 동작한다는 것을 실증했다.
