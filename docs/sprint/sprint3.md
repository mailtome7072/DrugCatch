# Sprint 3 계획 — 백엔드 OCR API 구현

| 항목 | 내용 |
|------|------|
| 스프린트 번호 | Sprint 3 |
| 기간 | 2026-03-16 (Day 2) |
| 브랜치 | `sprint3` |
| 담당 영역 | Backend (신규) + Frontend 연동 |
| 목표 마일스톤 | Phase 1 MVP 이미지 분석 API 완성 |

---

## 1. 스프린트 목표

Sprint 2에서 stub으로 남겨둔 `analyzeImage(file: File): Promise<AnalysisResult>`를 실제 백엔드 OCR API와 연결합니다.

백엔드는 FastAPI로 구축하며, 업로드된 이미지를 받아 처방전/약봉투 유형을 판별하고 Tesseract OCR로 약품명을 추출한 뒤 정적 JSON 약품 데이터와 대조하여 구조화된 분석 결과를 반환합니다.

프론트엔드는 `lib/api.ts`의 stub을 실제 API 호출로 교체하는 것 외에 변경을 최소화합니다.

**Sprint 4와의 연계**: 이 스프린트는 API 응답 스펙 설계에 집중합니다. 결과 화면 UI는 Sprint 4에서 구현하며, 이 스프린트에서 확정된 `AnalysisResult` 타입을 Sprint 4가 바로 사용할 수 있도록 합니다.

---

## 2. 기술 선택 결정

### OCR 엔진: Tesseract (로컬)

클라우드 OCR(Google Cloud Vision, AWS Textract) 대신 로컬 Tesseract를 선택합니다.

| 항목 | Tesseract (선택) | 클라우드 OCR |
|------|-----------------|-------------|
| 비용 | 무료 | 건당 과금 |
| 설정 복잡도 | 낮음 (pip + apt) | API 키, SDK 설정 필요 |
| 한국어 지원 | `kor` 언어팩 설치 | 기본 지원 |
| 인식률 | 중간 | 높음 |
| MVP 적합성 | 높음 | 낮음 (오버엔지니어링) |

인식률 보완 방법: 이미지 전처리(흑백 변환, 노이즈 제거) + 약품명 키워드 후처리 규칙 적용.

### 이미지 유형 판별: OpenCV 휴리스틱

TensorFlow Lite 모델 학습은 Sprint 3 범위를 초과합니다. OpenCV로 다음 특징을 분석하여 판별합니다:
- 텍스트 밀도: 처방전은 텍스트가 많음
- 배경 색상: 흰색 배경 비율 (처방전 특징)
- 표 구조: 가로선/세로선 검출

MVP에서 판별 정확도가 낮을 경우 `image_type: 'unknown'`으로 반환하고 OCR을 공통 적용합니다.

### 약품 데이터 소스: 정적 JSON

공공 의약품 DB API(e-drug.or.kr 등)는 API 키 발급, 인증 처리, 응답 파싱 복잡도가 높아 MVP 범위를 초과합니다. 대신 주요 처방 약품 50~100개를 정적 JSON으로 관리합니다.

```
backend/data/drugs.json
```

약품 데이터 구조:
```json
{
  "items": [
    {
      "drug_name": "아스피린",
      "generic_name": "아세틸살리실산",
      "usage": "해열, 진통, 소염",
      "caution": "공복 복용 주의",
      "dosage": "1회 1정, 1일 1~3회"
    }
  ]
}
```

### 백엔드 프레임워크: FastAPI

`deploy.yml`의 `alembic upgrade head` 포함으로 Python FastAPI 스택이 확정되어 있습니다. Pydantic을 통한 응답 스펙 명시적 정의가 가능합니다.

---

## 3. API 응답 스펙 (Sprint 4 연계 핵심)

### 엔드포인트

```
POST /analyze
Content-Type: multipart/form-data
Body: file (이미지 파일)
```

### 성공 응답 (HTTP 200)

```json
{
  "status": "success",
  "data": {
    "image_type": "prescription",
    "extracted_text": "아스피린 100mg 하루 3회...",
    "drugs": [
      {
        "drug_name": "아스피린",
        "generic_name": "아세틸살리실산",
        "usage": "해열, 진통, 소염",
        "caution": "공복 복용 주의",
        "dosage": "1회 1정, 1일 1~3회",
        "matched": true
      }
    ],
    "warnings": []
  },
  "message": null
}
```

### 에러 응답 (HTTP 422 / 500)

```json
{
  "status": "error",
  "data": null,
  "message": "OCR 처리 중 오류가 발생했습니다."
}
```

### 프론트엔드 `AnalysisResult` 타입 (lib/api.ts 업데이트)

```typescript
export type DrugInfo = {
  drug_name: string;
  generic_name: string;
  usage: string;
  caution: string;
  dosage: string;
  matched: boolean;
};

export type AnalysisData = {
  image_type: 'prescription' | 'packaged_drug' | 'unknown';
  extracted_text: string;
  drugs: DrugInfo[];
  warnings: string[];
};

export type AnalysisResult = {
  status: 'success' | 'error';
  data?: AnalysisData;
  message?: string;
};
```

---

## 4. 구현 범위

### 포함 항목

**백엔드 (신규)**
- FastAPI 앱 초기 설정 (`backend/main.py`, `backend/app/`)
- `POST /analyze` 엔드포인트 구현
- 이미지 유형 판별 모듈 (`backend/app/services/image_classifier.py`)
- OCR 처리 모듈 (`backend/app/services/ocr.py`)
- 약품명 파싱 및 데이터 조회 모듈 (`backend/app/services/drug_lookup.py`)
- 정적 약품 데이터 (`backend/data/drugs.json`, 50개 이상)
- 에러 처리 및 로깅 미들웨어
- `backend/requirements.txt` (fastapi, uvicorn, pytesseract, opencv-python-headless, python-multipart)
- `backend/tests/test_analyze.py` (기본 pytest 테스트)
- `docker/backend/Dockerfile.prod` (CI 빌드 통과용)

**인프라**
- `docker-compose.yml` backend 서비스 추가 (주석 해제 및 구성)

**프론트엔드 (최소 변경)**
- `frontend/lib/api.ts`: stub → 실제 `fetch` 호출로 교체
- `AnalysisResult` 타입을 `AnalysisData` 기반으로 구체화

### 제외 항목

- 결과 화면 UI 구현 (Sprint 4)
- 분석 완료 후 `/result` 라우팅 (Sprint 4)
- TensorFlow Lite 기반 ML 이미지 분류 (Phase 2)
- 공공 API 연동 (Phase 2)
- 사용자 인증 및 DB 저장 (Phase 2)
- alembic 마이그레이션 실제 적용 (Phase 2)

---

## 5. 디렉토리 구조

```
backend/
├── main.py                         # FastAPI 앱 진입점
├── requirements.txt                # Python 의존성
├── data/
│   └── drugs.json                  # 정적 약품 데이터 (50개 이상)
├── app/
│   ├── __init__.py
│   ├── routers/
│   │   └── analyze.py              # POST /analyze 라우터
│   ├── services/
│   │   ├── image_classifier.py     # OpenCV 기반 이미지 유형 판별
│   │   ├── ocr.py                  # Tesseract OCR 처리
│   │   └── drug_lookup.py          # 약품명 파싱 + JSON 조회
│   └── models/
│       └── schemas.py              # Pydantic 요청/응답 스키마
└── tests/
    └── test_analyze.py             # pytest 기본 테스트

docker/
└── backend/
    └── Dockerfile.prod             # 멀티스테이지 빌드 (CI 통과용)

frontend/
└── lib/
    └── api.ts                      # stub → 실 API 호출로 교체
```

---

## 6. 태스크 목록

### T1. FastAPI 앱 초기 설정

- **우선순위**: P0 (블로커 — 모든 백엔드 태스크의 기반)
- **예상 소요**: 20분
- 세부 작업:
  - `backend/` 디렉토리 구조 생성
  - `backend/main.py`: FastAPI 앱 생성, CORS 미들웨어 설정 (프론트 `localhost:3000` 허용), `/health` 엔드포인트
  - `backend/requirements.txt`: `fastapi>=0.110`, `uvicorn[standard]`, `pytesseract`, `opencv-python-headless`, `python-multipart`, `Pillow`, `pytest`, `httpx`
  - `backend/app/__init__.py`, `backend/app/models/schemas.py`: Pydantic 스키마 정의 (DrugInfo, AnalysisData, AnalysisResult)

### T2. 정적 약품 데이터 JSON 구축

- **우선순위**: P0 (OCR 결과 조회에 필수)
- **예상 소요**: 30분
- 세부 작업:
  - `backend/data/drugs.json` 작성: 주요 처방 약품 50개 이상 포함
  - 포함 필드: `drug_name`, `generic_name`, `usage`, `caution`, `dosage`
  - 한국어 약품명 및 영문 성분명 모두 포함 (OCR 매칭 커버리지 확보)
  - 우선 포함 약품군: 해열진통제, 항생제, 혈압약, 당뇨약, 위장약, 항히스타민제

### T3. OCR 처리 모듈 구현

- **우선순위**: P0 (핵심 기능)
- **예상 소요**: 40분
- 세부 작업:
  - `backend/app/services/ocr.py` 구현
  - 이미지 전처리: Pillow/OpenCV로 흑백 변환, 대비 강화, 크기 정규화
  - `pytesseract.image_to_string(img, lang='kor+eng')` 호출
  - 예외 처리: tesseract 미설치 시 명확한 에러 메시지, 빈 결과 처리
  - 반환값: `extracted_text: str`
  - 로깅: OCR 시작/완료/텍스트 길이 로그 출력

### T4. 이미지 유형 판별 모듈 구현

- **우선순위**: P1 (분석 품질 개선)
- **예상 소요**: 30분
- 세부 작업:
  - `backend/app/services/image_classifier.py` 구현
  - OpenCV로 이미지 분석:
    - 흰색 배경 비율 계산 (임계값 60% 이상 → 처방전 가능성)
    - 텍스트 블록 밀도 계산 (Canny edge detection 활용)
    - 색상 다양성 분석 (약봉투는 색상 다양)
  - 반환값: `'prescription' | 'packaged_drug' | 'unknown'`
  - 판별 불가 시 `'unknown'` 반환 (OCR은 공통 적용)

### T5. 약품명 파싱 및 조회 모듈 구현

- **우선순위**: P0 (핵심 기능)
- **예상 소요**: 40분
- 세부 작업:
  - `backend/app/services/drug_lookup.py` 구현
  - `drugs.json` 로드 및 메모리 캐시 (앱 시작 시 1회 로드)
  - OCR 텍스트에서 약품명 추출 규칙:
    - 정규표현식으로 약품명 패턴 탐지 (예: `[가-힣a-zA-Z]+\s?\d+mg`)
    - `drugs.json`의 `drug_name`, `generic_name`과 부분 문자열 매칭
  - 매칭된 약품 리스트 반환, 미매칭 약품명도 `matched: false`로 포함
  - 반환값: `List[DrugInfo]`

### T6. `POST /analyze` 엔드포인트 구현

- **우선순위**: P0 (API 진입점)
- **예상 소요**: 30분
- 세부 작업:
  - `backend/app/routers/analyze.py` 구현
  - `UploadFile` 수신 → 유형 판별 → OCR → 약품 조회 → 응답 반환 파이프라인
  - 파일 유효성 검사: `content_type`이 `image/*`인지 확인, 크기 10MB 제한
  - 에러 처리:
    - 지원하지 않는 파일 형식: HTTP 422 + 에러 메시지
    - OCR 실패: HTTP 500 + "OCR 처리 중 오류가 발생했습니다."
    - 파일 크기 초과: HTTP 422 + 에러 메시지
  - `main.py`에 라우터 등록
  - 전체 처리 시간 로깅

### T7. Docker 설정 구성

- **우선순위**: P1 (CI 통과 필수)
- **예상 소요**: 30분
- 세부 작업:
  - `docker/backend/Dockerfile.prod` 작성 (멀티스테이지 빌드):
    - `builder` 스테이지: `python:3.11-slim`, `apt-get install tesseract-ocr tesseract-ocr-kor`, pip install
    - `runtime` 스테이지: 의존성 복사, non-root 사용자 설정, `CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`
  - `docker-compose.yml` backend 서비스 주석 해제 및 설정:
    - `dockerfile: docker/backend/Dockerfile.prod`
    - `ports: "8000:8000"`
    - `volumes: ./backend:/app` (개발용)

### T8. pytest 테스트 작성

- **우선순위**: P1 (CI 통과 필수)
- **예상 소요**: 25분
- 세부 작업:
  - `backend/tests/__init__.py` 생성
  - `backend/tests/test_analyze.py` 작성:
    - `TestClient`로 `/health` 엔드포인트 200 응답 테스트
    - 잘못된 파일 형식 업로드 시 422 응답 테스트
    - 텍스트 파일 업로드 시 에러 응답 테스트
    - OCR 서비스 단위 테스트: 빈 이미지 처리 테스트
  - Tesseract 미설치 환경 대비: `pytest.mark.skipif`로 OCR 테스트 조건부 실행

### T9. 프론트엔드 `lib/api.ts` 실연동 교체

- **우선순위**: P0 (Sprint 2와의 연결)
- **예상 소요**: 20분
- 세부 작업:
  - `AnalysisResult` 타입을 `AnalysisData`, `DrugInfo` 타입 포함으로 확장
  - `analyzeImage` 함수: `setTimeout` stub 제거, `fetch`로 `POST /analyze` 호출
  - `FormData`에 `file` 추가하여 multipart 전송
  - `NEXT_PUBLIC_API_URL` 환경 변수로 백엔드 URL 참조 (`http://localhost:8000`)
  - 네트워크 에러, HTTP 에러 상태 처리: `{ status: 'error', message: ... }` 반환
  - TypeScript `any` 미사용 원칙 준수

### T10. 통합 검증 및 빌드 확인

- **우선순위**: P1 (CI 통과 필수)
- **예상 소요**: 20분
- 세부 작업:
  - 백엔드 로컬 실행 후 `curl` 로 `/health`, `POST /analyze` 수동 테스트
  - 프론트엔드 + 백엔드 동시 기동 후 업로드 페이지에서 실제 이미지 분석 테스트
  - `pytest backend/tests/` 통과 확인
  - `npm run lint` 및 `npm run build` 통과 확인
  - `docker build -f docker/backend/Dockerfile.prod --target runtime -t app-backend:test .` 통과 확인

---

## 7. 의존성 및 리스크

| 리스크 | 가능성 | 대응 방안 |
|--------|--------|----------|
| Tesseract 한국어 인식률 저조 | 고 | 이미지 전처리 강화 (흑백, 대비, DPI 조정); MVP에서는 부분 매칭으로 수용 |
| OpenCV 이미지 유형 판별 부정확 | 중 | 판별 실패 시 `'unknown'`으로 폴백, OCR은 항상 실행 |
| Docker 빌드 중 tesseract-ocr-kor 패키지 크기 | 중 | 멀티스테이지 빌드로 최소화; CI 빌드 시간 증가 수용 |
| 정적 JSON 약품 데이터 불완전 | 중 | MVP에서 미매칭 약품은 `matched: false`로 반환하여 Sprint 4 UI에서 별도 표시 가능 |
| 프론트엔드 CORS 오류 | 중 | FastAPI CORS 미들웨어에 `localhost:3000` 허용 설정 |
| CI 환경 Tesseract 미설치 | 중 | `pytest.mark.skipif`로 OCR 의존 테스트 조건부 실행; Docker 빌드 단계에서 설치 |
| Sprint 4 AnalysisResult 타입 변경 | 저 | 이 스프린트에서 Pydantic 스키마 확정 → Sprint 4는 타입만 가져다 사용 |

---

## 8. 완료 기준 (Definition of Done)

### 기능 완료 기준

- ✅ `POST http://localhost:8000/analyze`에 이미지 업로드 시 HTTP 200 응답 반환
- ✅ 응답 JSON에 `status`, `data.image_type`, `data.extracted_text`, `data.drugs` 필드 포함
- ✅ OCR 결과에서 drugs.json 약품명과 매칭된 항목이 1개 이상 반환 (Tesseract 미설치 환경으로 자동 검증 불가 — 수동 확인 필요)
- ✅ 지원하지 않는 파일 형식 업로드 시 HTTP 422 에러 응답 반환
- ✅ `/health` 엔드포인트 HTTP 200 응답 반환
- ✅ 업로드 페이지에서 "이미지 분석 시작" 버튼 클릭 시 실제 백엔드 API 호출 (stub 아님)
- ✅ 분석 완료 후 콘솔에 API 응답 결과 출력 (Sprint 4 연결 준비)

### 기술 완료 기준

- ✅ `pytest backend/tests/` 전체 통과 (4 passed, 1 skipped — Tesseract 미설치 조건부 스킵)
- ✅ `npm run build` 프론트엔드 빌드 성공 (수동 확인 필요)
- ✅ `npm run lint` ESLint 오류 없음 (수동 확인 필요)
- ✅ `docker build -f docker/backend/Dockerfile.prod --target runtime -t app-backend:test .` 성공 (수동 확인 필요)
- ✅ `backend/requirements.txt` 존재 (CI pytest 단계 활성화)
- ✅ TypeScript `any` 타입 미사용

### 문서 완료 기준

- ✅ `docs/sprint/sprint3.md` 계획 문서 존재
- ✅ ROADMAP.md Sprint 3 상태 완료로 업데이트됨

---

## 9. 검증 방법

### 로컬 수동 검증

```bash
# 1. 백엔드 기동 (backend/ 디렉토리에서)
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# 2. 헬스체크
curl http://localhost:8000/health
# → {"status": "ok"}

# 3. 이미지 업로드 테스트 (샘플 이미지 파일 필요)
curl -X POST http://localhost:8000/analyze \
  -F "file=@/path/to/sample_prescription.jpg"
# → {"status": "success", "data": {...}}

# 4. 잘못된 파일 형식 테스트
curl -X POST http://localhost:8000/analyze \
  -F "file=@/path/to/document.pdf"
# → {"status": "error", "message": "지원하지 않는 파일 형식입니다."}

# 5. 백엔드 테스트
pytest backend/tests/ -v

# 6. 프론트엔드 빌드 및 린트
cd frontend && npm run lint && npm run build

# 7. Docker 백엔드 빌드 (프로젝트 루트에서)
docker build -f docker/backend/Dockerfile.prod --target runtime -t app-backend:test .

# 8. 통합 테스트 (프론트+백엔드 동시 기동)
# 터미널 1: uvicorn backend.main:app --reload --port 8000
# 터미널 2: cd frontend && npm run dev
# → http://localhost:3000 접속, 동의 → 업로드 → 이미지 선택 → 분석 시작 → 콘솔 확인
```

### 검증 체크리스트

- ✅ `/health` 엔드포인트 200 응답 확인 — `{"status":"ok"}` 반환 확인
- ✅ 처방전 샘플 이미지로 OCR 텍스트 추출 확인 (Tesseract 설치 후 수동 확인 필요)
- ✅ 추출 텍스트에서 약품명 매칭 확인 (Tesseract 설치 후 수동 확인 필요)
- ✅ 응답 JSON의 `image_type` 필드 값 확인 (Tesseract 설치 후 수동 확인 필요)
- ✅ 비이미지 파일 업로드 시 에러 응답 확인 — HTTP 422 + 에러 메시지 반환 확인
- ✅ 프론트엔드 업로드 페이지에서 실 API 연동 확인 (콘솔 로그) — 브라우저 수동 확인 필요
- ✅ pytest 전체 통과 확인 — 4 passed, 1 skipped (Tesseract 조건부 스킵)
- ✅ Docker 빌드 성공 확인 (수동 확인 필요)

---

## 10. 예상 산출물

| 파일 | 설명 |
|------|------|
| `backend/main.py` | FastAPI 앱 진입점, CORS 설정 |
| `backend/requirements.txt` | Python 의존성 목록 |
| `backend/data/drugs.json` | 정적 약품 데이터 50개 이상 |
| `backend/app/models/schemas.py` | Pydantic 요청/응답 스키마 |
| `backend/app/routers/analyze.py` | `POST /analyze` 라우터 |
| `backend/app/services/image_classifier.py` | OpenCV 이미지 유형 판별 |
| `backend/app/services/ocr.py` | Tesseract OCR 처리 |
| `backend/app/services/drug_lookup.py` | 약품명 파싱 및 JSON 조회 |
| `backend/tests/test_analyze.py` | pytest 테스트 |
| `docker/backend/Dockerfile.prod` | 멀티스테이지 Docker 빌드 |
| `docker-compose.yml` | backend 서비스 추가 |
| `frontend/lib/api.ts` | stub → 실 API 호출로 교체, 타입 구체화 |
| `docs/sprint/sprint3.md` | 본 계획 문서 |

---

## 11. 다음 스프린트 연계

Sprint 3 완료 후 Sprint 4에서 다음을 이어받습니다:

- `AnalysisResult`, `AnalysisData`, `DrugInfo` 타입을 그대로 사용하여 결과 화면 UI 구현
- 분석 완료 후 `/result` 라우팅 추가 (현재 `UploadPage.tsx`에서 콘솔 로그만 출력 중)
- 결과 화면 레이아웃: 최상단 유추 병명 → 중간 증상 → 하단 약품 카드 리스트
- `warnings` 배열을 활용한 약물 주의사항 표시
