# Sprint 7 — 핵심 모듈 단위 테스트 작성

## 개요

| 항목 | 내용 |
|------|------|
| 스프린트 번호 | Sprint 7 |
| 브랜치 | `sprint7` |
| 기간 | 1일 |
| 작업 디렉토리 | `backend/tests/` |
| 선행 스프린트 | Sprint 6 (Claude Vision API 연동) |

---

## 배경 및 목적

Sprint 6 코드 리뷰에서 외부 API 의존 모듈의 단위 테스트 부재가 Medium 이슈로 지적되었다.
현재 `backend/tests/test_analyze.py`에는 5개의 통합 테스트만 존재하며, 핵심 서비스 모듈인
`vision_identifier.py`, `pill_identifier.py`, `drug_api.py`에 대한 단위 테스트가 없다.

`unittest.mock` 표준 라이브러리만 사용해 외부 API/OpenCV 의존성을 mock 처리함으로써
추가 의존성 없이 모든 경계 조건을 검증한다.

---

## 스프린트 목표

- `vision_identifier.py`, `pill_identifier.py`, `drug_api.py` 3개 모듈의 핵심 경로를 단위 테스트로 커버한다.
- `pytest backend/tests/ -v` 전체 통과 (기존 통합 테스트 포함)
- 외부 API 실제 호출 없음 — 모든 HTTP/SDK 호출을 mock 처리

---

## 구현 범위

### 포함

- `backend/tests/test_vision_identifier.py` 신규 작성
- `backend/tests/test_pill_identifier.py` 신규 작성
- `backend/tests/test_drug_api.py` 신규 작성

### 제외

- 기존 `test_analyze.py` 수정 없음
- 프론트엔드 테스트
- 새 pip 의존성 추가 (`unittest.mock`, `numpy`는 이미 설치됨)

---

## 작업 분해 (Task Breakdown)

### Task 1 — `test_vision_identifier.py` 작성 (1.5h)

**대상**: `backend/app/services/vision_identifier.py`의 `identify_drugs_from_image()`

| # | 테스트 케이스 | mock 대상 | 검증 포인트 |
|---|-------------|-----------|-------------|
| T1-1 | ANTHROPIC_API_KEY 미설정 | `os.environ.get` | 빈 리스트 반환 |
| T1-2 | 정상 API 응답 — 단순 약품명 | `anthropic.Anthropic` | `["타이레놀"]` 반환 |
| T1-3 | 괄호 설명 제거 | `anthropic.Anthropic` | `"ZC81 (분홍색 정제)"` → `"ZC81"` |
| T1-4 | 전각 괄호 제거 | `anthropic.Anthropic` | `"아스피린（분말）"` → `"아스피린"` |
| T1-5 | "미상" 포함 항목 필터링 | `anthropic.Anthropic` | 결과에서 제외 |
| T1-6 | "불명" 포함 항목 필터링 | `anthropic.Anthropic` | 결과에서 제외 |
| T1-7 | API 예외 발생 | `anthropic.Anthropic` | 빈 리스트 반환 (graceful fallback) |
| T1-8 | 약품명이 없는 응답 | `anthropic.Anthropic` | 빈 리스트 반환 |

**구현 전략**:
- `unittest.mock.patch("vision_identifier.os.environ.get")` 로 API 키 제어
- `unittest.mock.MagicMock()`으로 `anthropic.Anthropic` 클라이언트 및 응답 객체 구성
- `message.content[0].text`에 응답 텍스트를 직접 주입

---

### Task 2 — `test_pill_identifier.py` 작성 (2h)

**대상**: `backend/app/services/pill_identifier.py`

#### 2-A. `identify_pills()` (3개 테스트)

| # | 테스트 케이스 | mock 대상 | 검증 포인트 |
|---|-------------|-----------|-------------|
| T2-1 | 유효하지 않은 바이트 | `cv2.imdecode` | 빈 리스트 반환 |
| T2-2 | `cv2.imdecode` None 반환 | `cv2.imdecode` | 빈 리스트 반환 |
| T2-3 | 정상 이미지 (합성 이미지) | 실제 cv2 호출 | `PillFeatures` 리스트 반환 |

**이미지 fixture**: `numpy.zeros((100, 100, 3), dtype=numpy.uint8)`로 합성 BGR 이미지 생성 후
`cv2.imencode(".png", ...)` → bytes 변환.

#### 2-B. `_classify_shape()` (3개 테스트)

| # | 입력 | 기대값 |
|---|------|--------|
| T2-4 | ratio < 1.2 인 컨투어 | `"원형"` |
| T2-5 | 1.2 ≤ ratio < 1.8 인 컨투어 | `"타원형"` |
| T2-6 | ratio ≥ 1.8 인 컨투어 | `"장방형"` |

**컨투어 생성 전략**: `numpy.array`로 직사각형 포인트 배열 수동 생성 (`len < 5`인 경우
boundingRect 경로 실행).

#### 2-C. `_map_hsv_to_color_name()` (10개 테스트)

| # | H / S / V | 기대값 |
|---|-----------|--------|
| T2-7 | S=10, V=230 | `"하양"` |
| T2-8 | S=10, V=50 | `"검정"` |
| T2-9 | S=10, V=130 | `"회색"` |
| T2-10 | H=5, S=150, V=200 | `"빨강"` |
| T2-11 | H=170, S=150, V=200 | `"빨강"` |
| T2-12 | H=12, S=150, V=200 | `"주황"` |
| T2-13 | H=25, S=150, V=200 | `"노랑"` |
| T2-14 | H=60, S=150, V=200 | `"초록"` |
| T2-15 | H=115, S=150, V=200 | `"파랑"` |
| T2-16 | H=150, S=150, V=200 | `"보라"` |

---

### Task 3 — `test_drug_api.py` 작성 (2h)

**대상**: `backend/app/services/drug_api.py`의 `fetch_drug_info()` 및 `fetch_drug_by_features()`

#### 3-A. `fetch_drug_info()` (3개 테스트)

| # | 테스트 케이스 | mock 대상 | 검증 포인트 |
|---|-------------|-----------|-------------|
| T3-1 | 정상 API 응답 | `httpx.get` | `DrugInfo` 반환 + `matched=True` |
| T3-2 | API 응답 items 빈 리스트 | `httpx.get` | `None` 반환 |
| T3-3 | 네트워크 예외 (`httpx.RequestError`) | `httpx.get` | `None` 반환 |

**주의**: `fetch_drug_info`는 `@lru_cache` 데코레이터로 감싸져 있으므로
각 테스트 케이스에서 서로 다른 `drug_name` 인자를 사용하거나,
`fetch_drug_info.cache_clear()`를 `setUp/tearDown`에서 호출한다.

#### 3-B. `fetch_drug_by_features()` (3개 테스트)

| # | 테스트 케이스 | mock 대상 | 검증 포인트 |
|---|-------------|-----------|-------------|
| T3-4 | `print_front` 길이 < 2 | 없음 (조기 반환) | 빈 리스트 반환 |
| T3-5 | 정상 응답 — shape/color 일치 | `httpx.get` | `DrugInfo` 리스트 반환 |
| T3-6 | shape 불일치 후처리 필터 | `httpx.get` | 필터된 후 빈 리스트 반환 |

**캐시 처리**: 각 테스트 전 `drug_api._pill_cache.clear()`로 캐시 초기화.

---

### Task 4 — 전체 테스트 실행 및 검증 (0.5h)

```bash
cd /Users/skyang/Projects/DrugCatch/backend
pytest tests/ -v
```

- 기존 5개 통합 테스트 + 신규 단위 테스트 전체 통과 확인
- 실제 외부 API 호출 없음 확인 (`--capture=sys`로 로그 확인)

---

## 기술적 접근 방법

### mock 구조 예시 (vision_identifier)

```python
# anthropic 라이브러리가 런타임에 import되므로 모듈 경로를 정확히 지정
@patch("app.services.vision_identifier.anthropic")
def test_parse_drug_name(mock_anthropic):
    mock_client = MagicMock()
    mock_anthropic.Anthropic.return_value = mock_client
    mock_msg = MagicMock()
    mock_msg.content[0].text = "약품명: 타이레놀\n약품명: ZC81 (분홍색 정제)"
    mock_client.messages.create.return_value = mock_msg
    ...
```

### 합성 이미지 생성 (pill_identifier)

```python
import cv2
import numpy as np

def _make_image_bytes(h=100, w=100) -> bytes:
    img = np.zeros((h, w, 3), dtype=np.uint8)
    # 중앙에 흰색 원 — 알약 컨투어 검출 유도
    cv2.circle(img, (50, 50), 30, (255, 255, 255), -1)
    _, buf = cv2.imencode(".png", img)
    return buf.tobytes()
```

### lru_cache 우회 전략

```python
import importlib
import app.services.drug_api as drug_api_module

def setup_function():
    drug_api_module.fetch_drug_info.cache_clear()
    drug_api_module._pill_cache.clear()
```

---

## 의존성 및 리스크

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| `anthropic` 라이브러리 import 경로 변동 | mock 실패 | 소스 코드 `from __future__` 확인 후 경로 재지정 |
| `cv2.imdecode` None 반환 mock — numpy array 타입 불일치 | `identify_pills` 내부 TypeError | `patch` 반환값을 `None`으로 명시 |
| `lru_cache` 캐시 오염으로 테스트 간 간섭 | 잘못된 테스트 결과 | 각 테스트 전 `cache_clear()` 호출 |
| `_pill_cache` dict 직접 공유로 인한 테스트 간 간섭 | 잘못된 테스트 결과 | `setUp`에서 `_pill_cache.clear()` 호출 |

---

## 완료 기준 (Definition of Done)

- ✅ `test_vision_identifier.py` 8개 테스트 작성 및 통과
- ✅ `test_pill_identifier.py` 16개 테스트 작성 및 통과
- ✅ `test_drug_api.py` 8개 테스트 작성 및 통과
- ✅ `pytest backend/tests/ -v` 전체 통과 (기존 통합 테스트 포함)
- ✅ 테스트 실행 중 실제 외부 API 호출 없음
- ✅ `sprint7` 브랜치에서 작업 완료

---

## 검증 결과 (2026-03-16)

### 자동 검증

```
pytest backend/tests/ -v
40 passed in 0.70s
```

| 테스트 파일 | 테스트 수 | 결과 |
|------------|----------|------|
| `test_vision_identifier.py` | 8 | ✅ 전체 통과 |
| `test_pill_identifier.py` | 16 | ✅ 전체 통과 |
| `test_drug_api.py` | 8 | ✅ 전체 통과 |
| `test_analyze.py` (기존) | 8 | ✅ 전체 통과 |
| **합계** | **40** | **✅ 전체 통과** |

- ✅ 외부 API 실제 호출 없음 (unittest.mock 완전 격리)
- ✅ `DRUG_API_KEY`, `ANTHROPIC_API_KEY` 미설정 환경에서도 전체 통과

### 수동 검증

- ⬜ Docker 빌드 후 통합 기동 확인 (`docker compose up --build`)

---

## 예상 산출물

| 파일 | 설명 |
|------|------|
| `backend/tests/test_vision_identifier.py` | `identify_drugs_from_image` 단위 테스트 8개 |
| `backend/tests/test_pill_identifier.py` | `identify_pills`, `_classify_shape`, `_map_hsv_to_color_name` 단위 테스트 16개 |
| `backend/tests/test_drug_api.py` | `fetch_drug_info`, `fetch_drug_by_features` 단위 테스트 6개 |

총 신규 테스트: **30개** (기존 5개 포함 총 35개)

---

## 참고

- 테스트 실행 환경: Python 3.11, pytest, numpy (기존 설치)
- mock 도구: `unittest.mock` (표준 라이브러리)
- CI에서 `DRUG_API_KEY`, `ANTHROPIC_API_KEY` 없이도 전체 통과해야 함
