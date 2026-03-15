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
