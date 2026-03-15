# Sprint 5 — 이미지 기반 알약 낱알식별 파이프라인 구현

**기간**: 2026-03-15
**브랜치**: `sprint5`
**상태**: ✅ 완료

---

## 목표

packaged_drug 및 unknown 이미지에서 알약의 시각적 특징(모양, 색상, 식별문자)을 추출하고,
식약처 낱알식별 API로 약품명을 조회하는 파이프라인을 구현합니다.
OCR 파이프라인 후 낱알 파이프라인을 순차 실행하여 결과를 중복 없이 병합합니다.

---

## 구현 내용

### 변경 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `backend/app/services/pill_identifier.py` | 신규 | OpenCV+pytesseract로 알약 모양/색상/식별문자 추출 (~218줄) |
| `backend/app/services/drug_api.py` | 수정 | `fetch_drug_by_features` 추가 — 식약처 낱알식별 API 연동, 모듈 레벨 캐시 |
| `backend/app/routers/analyze.py` | 수정 | packaged_drug/unknown 이미지에서 낱알 파이프라인 실행, 중복 제거 개선, 경고 조건 수정 |

### 구현 상세

#### `pill_identifier.py` (신규)

- **`identify_pills(image_bytes)`**: GaussianBlur → HSV 변환 → 배경 마스크(흰/검/회색) → contour 검출 → 모양/색상/OCR 추출 순서로 처리
- **`_detect_pill_contours()`**: 흰색·검정·회색 배경을 HSV 범위로 마스킹 후 전경 마스크 추출, 형태학적 연산(OPEN/CLOSE)으로 노이즈 제거
- **`_classify_shape()`**: `cv2.fitEllipse`로 aspect ratio 계산 → 원형/타원형/장방형 분류
- **`_extract_dominant_colors()`**: HSV H채널 히스토그램으로 주요 색상 1~2개 추출, 이색 알약 지원
- **`_extract_pill_text()`**: CLAHE 대비 강화 → Otsu 이진화 → pytesseract psm 8(단일 단어) OCR
- **`_map_hsv_to_color_name()`**: OpenCV HSV 값을 식약처 낱알식별 API 색상명(하양/빨강/주황 등)으로 매핑
- 모든 예외는 graceful fallback (빈 리스트 반환)

#### `drug_api.py` (수정)

- **`fetch_drug_by_features(shape, color1, color2, print_front)`**: 식약처 낱알식별 API(`MdcinGrnIdntfcInfoService03`) 호출
  - v01(`MdcinGrnIdntfcInfoService01`)은 서비스 중단됨 → v03로 URL 변경
  - v03는 shape/color 파라미터 필터 미지원 → `print_front` 값을 `item_name` 파라미터로 검색
  - 검색 결과를 `DRUG_SHAPE`, `COLOR_CLASS1` 응답 필드로 후처리 필터 적용
  - 요청 파라미터명: camelCase → snake_case (`drug_shape`, `color_class1`, `color_class2`, `print_front`)
  - 응답 필드: `CLASS_NAME` → `CHART`(성상), 빈 이름 항목 자동 필터
- `print_front` 없거나 2자 미만이면 의미 있는 검색 불가하여 빈 리스트 즉시 반환
- 모듈 레벨 `_pill_cache` dict로 동일 조합 재조회 방지 (lru_cache 미사용 이유: mutable 기본값 허용)

#### `analyze.py` (수정)

- `image_type in ("packaged_drug", "unknown")` 조건에서 낱알 파이프라인 실행
- `pill_identified` 결과를 `matched_drugs + api_matched + still_unmatched`에 합산 후 약품명 기준 중복 제거
- 경고 조건 개선: `not extracted_text and not pill_identified` (낱알 결과 있으면 텍스트 경고 미표시)
- `not all_matched and not pill_identified` (낱알 결과 있으면 미매칭 경고 미표시)

---

## 완료 기준 달성

- ✅ packaged_drug/unknown 이미지에서 낱알식별 API 조회 경로 추가
- ✅ OpenCV contour 에러 시 graceful fallback (빈 리스트 반환)
- ✅ 낱알식별 결과가 OCR 결과와 중복 없이 병합
- ✅ pytest 5개 통과 (회귀 없음)
- ✅ 낱알식별 API v01→v03 전환 완료
- ✅ image_classifier.py 과도한 처방전 판정 버그 수정 (text_density 조건 추가)

---

## 코드 리뷰 결과

### 보안

- ✅ 하드코딩된 시크릿 없음 — `DRUG_API_KEY` 환경변수로 관리
- ✅ XSS 관련 변경 없음 (백엔드 전용 파이프라인)
- ✅ 외부 API 호출 시 timeout=5.0 설정으로 무한 대기 방지

### 성능

- ✅ `_pill_cache` dict로 동일 feature 조합 재조회 방지
- ✅ contour 최대 10개 제한 (`[:10]`) — 대형 이미지 과다 처리 방지
- ✅ 면적 500 미만 contour 필터링 — 노이즈 제외
- Medium: `_pill_cache`가 무한 성장 가능 — LRU 방식 또는 크기 제한 향후 개선 권장

### 코드 품질

- ✅ `from __future__ import annotations` + dataclass 활용으로 타입 명시적
- ✅ `try/except ImportError`로 pytesseract 미설치 환경 graceful 처리
- ✅ 모든 외부 호출 예외 처리 후 빈 리스트/빈 문자열 반환
- Medium: `_pill_cache`가 프로세스 수명 동안 유지 — 메모리 증가 모니터링 필요

### 테스트

- ✅ 기존 pytest 5개 회귀 없음 (fix 커밋 후에도 5 passed 확인)
- Medium: `pill_identifier.py`의 `identify_pills`, `_classify_shape`, `_extract_dominant_colors` 단위 테스트 미작성 — 향후 케이스 추가 시 작성 권장

### 패턴 준수

- ✅ 서비스 계층(`services/`)에 새 모듈 추가, 라우터에서 지연 임포트 사용
- ✅ `DrugInfo` 스키마 재사용 — 낱알식별 결과도 동일 타입으로 통일

---

## 자동 검증 결과

- ✅ `pytest backend/tests/` 5개 통과 (fix 커밋 후 재확인 포함)
- ✅ `/health` 엔드포인트 HTTP 200 확인 (`{"status":"ok"}`)
- ✅ `/analyze` 엔드포인트 POST 정상 동작 확인 (status: success, image_type: packaged_drug)
- ✅ 프론트엔드 `/upload` 라우트 HTTP 200 확인
- ✅ 프론트엔드 `/result` 라우트 HTTP 200 확인

## Fix 커밋 내역 (스프린트 완료 후)

| 커밋 | 설명 |
|------|------|
| `b456195` | 낱알식별 API 파라미터/응답 필드명 수정 (`camelCase → snake_case`), `pill_identifier.py` 배경 마스크 HSV 범위 완화, 색상 매핑 확충 (분홍·연두·갈색·자주 추가) |
| `f3d62c4` | 낱알식별 API v01→v03 전환, `print_front` 기반 검색 로직으로 변경, 후처리 필터 추가 |

수동 검증 항목: `deploy.md` 참조

---

## 회고 (Retrospective)

### 잘 된 점 (Keep)
- 식약처 낱알식별 API v01 폐지 문제를 v03 마이그레이션으로 신속하게 대응했다. v03의 파라미터 제한(shape/color 필터 미지원)을 발견하고 `print_front` 기반 검색 + 후처리 필터로 우회하는 창의적 해결책을 시도했다.
- `identify_pills` 파이프라인에서 모든 외부 호출 예외를 `try/except`로 감싸고 빈 리스트를 반환하는 graceful fallback 패턴이 Sprint 6 Vision API 교체 시에도 동일하게 적용되었다.
- `_pill_cache` 모듈 레벨 딕셔너리로 동일 특징 조합의 API 재조회를 방지한 캐싱 전략이 `lru_cache`보다 유연했다(mutable 파라미터 허용).
- contour 최대 10개, 면적 500 미만 필터를 통해 대형 이미지의 과다 처리를 방지했다.

### 문제점 (Problem)
- 식약처 낱알식별 API v03가 `print_front`/`drug_shape`/`color_class1` 등 핵심 파라미터를 지원하지 않는다는 사실을 API 문서가 아닌 실제 호출 실험에서 발견했다. 사전 API 스펙 검토 단계가 부재했다.
- v01 API가 영구 중단되고 v02는 404, v03은 파라미터 미지원 상태로 전체 식약처 낱알식별 API 계열이 사실상 사용 불가 상태였다. 이는 Sprint 5 전체 방향성이 잘못 설정된 핵심 원인이었다.
- `pill_identifier.py`의 `identify_pills`, `_classify_shape`, `_extract_dominant_colors`에 대한 단위 테스트가 작성되지 않았다. Sprint 7에서 소급 추가가 필요했다.
- `_pill_cache`가 프로세스 수명 동안 무한 성장 가능한 구조였다. LRU 방식의 크기 제한 미적용이 코드 리뷰에서 Medium 이슈로 지적되었다.

### 개선 방향 (Try)
- 공공 API를 사용하기 전에 반드시 공식 문서 + Postman/curl 직접 호출로 지원 파라미터를 검증하는 단계를 계획에 포함한다.
- 외부 API 의존 기능은 처음부터 fallback 경로를 설계한다. Sprint 5처럼 API가 폐지/변경될 경우를 대비한 Plan B를 스프린트 계획 단계에서 명시한다.
- 캐시 자료구조는 `collections.OrderedDict` 또는 `functools.lru_cache` 방식으로 크기 제한을 두어 메모리 누수를 방지한다.

### 핵심 학습 (Key Learnings)
- 정부 공공 API는 버전 관리가 불규칙하고 폐지 공지 없이 중단되는 경우가 있다. 특히 식약처 낱알식별 API v01 중단 사례는 외부 API 의존성의 리스크를 직접 체험한 사례였다.
- OpenCV contour 기반 알약 감지는 배경 색상, 조명, 이미지 품질에 극히 민감하여 실제 사용자 환경에서 신뢰할 수 있는 결과를 내기 어렵다는 점을 확인했다. 이것이 Sprint 6에서 Claude Vision API로 전환한 근본 이유였다.
