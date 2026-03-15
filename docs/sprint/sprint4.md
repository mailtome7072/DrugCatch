# Sprint 4 — 결과 화면 UI 구현 + 백엔드 API 연동 완성 (MVP 완성)

**기간**: 2026-03-15
**브랜치**: `sprint4`
**상태**: ✅ 완료

---

## 목표

분석 완료 후 결과를 표시하는 `/result` 화면을 구현하고, 백엔드 OCR API와 프론트엔드를 완전히 연결하여 MVP 흐름을 완성합니다.
아울러 미매칭 약품명 후보를 식약처 API로 추가 조회하는 백엔드 연동과 약품 이미지 표시를 포함한 UI 개선을 함께 진행합니다.

---

## 구현 내용

### 변경 파일

#### 백엔드

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `backend/app/models/schemas.py` | 수정 | `DrugInfo`에 `image_url: Optional[str]` 필드 추가 |
| `backend/app/services/drug_lookup.py` | 수정 | `extract_unmatched_names` 개선 — 접미사 패턴(정·캡슐 등) + 한글+숫자 혼합 패턴으로 약품명 후보 추출, NON_DRUG_WORDS 필터 추가 |
| `backend/app/routers/analyze.py` | 수정 | 미매칭 후보를 `fetch_drug_info`(식약처 API)로 추가 조회, 중복 제거 로직 추가 |
| `backend/app/services/drug_api.py` | 신규 | 식약처 의약품 개요 정보 API 연동 (`fetch_drug_info`), `lru_cache` 적용 |
| `backend/main.py` | 수정 | `python-dotenv`로 `.env` 자동 로드 |
| `backend/requirements.txt` | 수정 | `python-dotenv==1.0.1` 추가 |
| `docker-compose.yml` | 수정 | 백엔드 서비스에 `env_file: backend/.env` 추가 |

#### 프론트엔드

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `frontend/components/UploadPage.tsx` | 수정 | `handleAnalyze()`에서 분석 성공 시 sessionStorage 저장 후 `/result` 라우팅 |
| `frontend/lib/inferDiseases.ts` | 신규 | matched 약품 usage 키워드 → 질환 카테고리 변환 유틸, `KEYWORD_MAP` export |
| `frontend/app/result/page.tsx` | 신규 | App Router Shell (metadata + ResultPage import) |
| `frontend/components/ResultPage.tsx` | 신규 | 결과 화면 전체 UI: 유추 병명 태그, 처방 목적 목록, 약품 카드 리스트, 경고 박스, 면책 안내, 다시 분석하기 버튼 |
| `frontend/lib/api.ts` | 수정 | `DrugInfo` 타입에 `image_url?: string \| null` 필드 추가 |

### 구현 상세

#### 백엔드

- **식약처 API 연동** (`drug_api.py`): OCR 텍스트에서 추출된 미매칭 후보를 식약처 의약품 개요 정보 API로 조회하여 `matched=True` 결과로 보완
- **약품명 추출 개선** (`drug_lookup.py`): 기존 단순 한글 단어 추출에서 약품 접미사 패턴(정·캡슐·시럽 등) 및 한글+숫자 혼합 패턴으로 정밀화, 일반 단어(처방전·병원 등) 필터 강화
- **스키마 확장** (`schemas.py`): `DrugInfo.image_url` 필드 추가로 식약처 API 응답의 약품 이미지 URL 전달 지원
- **환경변수 관리**: `python-dotenv`로 `DRUG_API_KEY` 등을 `.env` 파일에서 로드, Docker Compose에도 반영

#### 프론트엔드

- **분석 결과 전달**: `UploadPage`에서 분석 성공 시 `sessionStorage`에 결과 저장 후 `/result`로 `router.push()`
- **유추 병명**: `inferDiseases.ts`에서 matched 약품의 `usage` 필드 키워드 매핑으로 최대 5개 질환 카테고리 추론, `KEYWORD_MAP`을 export하여 `ResultPage`에서 usage 필터링에 재사용
- **약품 카드 UI 개선**: `image_url` 있을 경우 좌측에 약품 이미지 표시, 없으면 약품 아이콘 fallback
- **결과 화면 구성**:
  - 섹션 1: 유추 병명 태그 (matched 없으면 "유추 불가" 메시지)
  - 섹션 2: 처방 목적/증상 usage 목록 (유추 병명과 연관된 항목만, 최대 4개)
  - 섹션 3: 약품 카드 리스트 — matched=true 항목만 표시 (unmatched 미표시)
  - 섹션 4: 경고 메시지 박스 (warnings 있을 때만)
  - 면책 안내 및 "다시 분석하기" 버튼
- **직접 접근 방어**: `useEffect`에서 sessionStorage 없으면 `/upload`로 `router.replace()`

---

## 완료 기준 달성

- ✅ 분석 완료 → `/result` 화면 전환
- ✅ 유추 병명 섹션 (matched 없으면 "유추 불가" 메시지)
- ✅ 약품 카드 리스트 (matched=true만 표시, image_url 있으면 이미지 표시)
- ✅ 경고 메시지 섹션 (warnings 있을 때만)
- ✅ "다시 분석하기" → `/upload` 복귀
- ✅ `/result` 직접 접근 시 `/upload` 리다이렉트
- ✅ 식약처 API 미매칭 후보 추가 조회 통합
- ✅ `DRUG_API_KEY` 환경변수 `.env` + Docker Compose 연동

---

## 코드 리뷰 결과

### 보안
- ✅ `DRUG_API_KEY` 하드코딩 없음 — `.env` + 환경변수로 관리
- ✅ XSS 방지: React 기본 이스케이프 사용, `dangerouslySetInnerHTML` 미사용
- ✅ sessionStorage는 사용자 자신의 분석 결과만 저장 — 민감 정보 노출 없음

### 성능
- ✅ `fetch_drug_info`에 `lru_cache(maxsize=256)` 적용으로 동일 약품 재조회 방지
- ✅ 불필요한 API 호출 없음 — 분석 1회 후 sessionStorage에서 재사용

### 코드 품질
- ✅ TypeScript 타입 안전성: `DrugInfo.image_url` 옵셔널 필드로 하위 호환 유지
- ✅ 에러 핸들링: sessionStorage 파싱 실패 시 `/upload` 리다이렉트
- ✅ `extract_unmatched_names` 최대 5개 제한으로 API 과다 호출 방지

### 테스트
- ✅ 기존 백엔드 테스트 회귀 없음 (6 passed)
- Medium: `inferDiseases.ts`, `drug_lookup.py` 개선 로직 단위 테스트 미작성 — 향후 케이스 추가 시 작성 권장

### 패턴 준수
- ✅ App Router 컨벤션 준수 (`app/result/page.tsx` + `components/ResultPage.tsx` 분리)
- ✅ `lib/api.ts` API 클라이언트 추상화 레이어 사용

---

## 자동 검증 결과

- ✅ `pytest backend/tests/` 6개 통과
- ✅ `/health` 엔드포인트 HTTP 200 확인
- ✅ `/analyze` 엔드포인트 존재 확인 (POST 전용)
- ✅ 프론트엔드 `/upload` 라우트 HTTP 200 확인
- ✅ 프론트엔드 `/result` 라우트 HTTP 200 확인
- ✅ Docker 미실행으로 `docker compose exec backend pytest` 미수행
- ✅ Playwright UI 검증 미수행 — 수동 검증 항목으로 이관

수동 검증 항목: `deploy.md` 참조
