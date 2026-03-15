# Sprint 1 계획 — 사용자 경고 및 동의 UI

| 항목 | 내용 |
|------|------|
| 스프린트 번호 | Sprint 1 |
| 기간 | 2026-03-15 (Day 1) |
| 브랜치 | `sprint1` |
| 담당 영역 | Frontend 전용 |
| 목표 마일스톤 | Phase 1 MVP 첫 번째 화면 완성 |

---

## 1. 스프린트 목표

Next.js 프로젝트를 초기화하고, 사용자가 앱 사용 전 개인정보 처리 및 전문가 확인 안내를 읽고 동의할 수 있는 동의 페이지를 구현합니다.
Sprint 2 이후의 이미지 입력 화면으로 라우팅할 수 있는 기반을 마련합니다.

---

## 2. 구현 범위

### 포함 항목

- Next.js 15 + TailwindCSS 프로젝트 초기화 (`frontend/` 디렉토리)
- 동의 페이지 UI (`/` 루트 페이지)
  - 앱 제목 및 서비스 설명 섹션
  - 경고 섹션: 개인정보/민감정보 처리 안내
  - 경고 섹션: 전문가 확인 필요 안내
  - 동의 체크박스 (체크 후 버튼 활성화)
  - "분석 시작" 버튼 (Sprint 2 라우팅 연결 예정 placeholder)
- Docker 설정 (`docker/frontend/Dockerfile.prod`, `docker-compose.yml`)
- CI 빌드 테스트 통과 (`docker/frontend/Dockerfile.prod` 경로 준수)

### 제외 항목

- 이미지 업로드 및 미리보기 기능 (Sprint 2)
- 백엔드 API 연동 (Sprint 3~4)
- 인증/로그인 기능 (현재 MVP 범위 밖)

---

## 3. 기술적 결정사항

### Frontend

| 항목 | 결정값 | 이유 |
|------|--------|------|
| Next.js 버전 | 15 (App Router) | 최신 안정 버전, App Router 기반 파일 시스템 라우팅 활용 |
| TailwindCSS 버전 | 4.x | Next.js 15와 호환되는 최신 버전 |
| Node.js | 22 LTS (Alpine) | Docker 이미지 경량화 |
| 패키지 매니저 | npm | CI 환경 호환성 |
| TypeScript | 사용 | 타입 안전성 확보 (CLAUDE.md 코드 품질 기준 준수) |

### 디렉토리 구조 (frontend/)

```
frontend/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (한국어 lang 설정)
│   ├── page.tsx            # 동의 페이지 (루트 /)
│   └── globals.css         # TailwindCSS 전역 스타일
├── components/
│   └── ConsentPage.tsx     # 동의 페이지 컴포넌트 (클라이언트 컴포넌트)
├── public/
├── package.json
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

### Docker 구조

```
docker/
├── frontend/
│   └── Dockerfile.prod     # CI/CD 파이프라인 참조 경로
└── backend/
    └── Dockerfile.prod     # 기존 파일 (변경 없음)
docker-compose.yml          # 프로젝트 루트
```

---

## 4. 태스크 목록

### T1. Next.js 프로젝트 초기화
- **우선순위**: P0 (블로커)
- **예상 소요**: 15분
- 세부 작업:
  - `frontend/` 디렉토리에 `npx create-next-app@latest` 실행
  - TypeScript, TailwindCSS, App Router, ESLint 활성화
  - `.gitignore`에 `frontend/node_modules`, `frontend/.next` 추가 확인
  - `frontend/.gitkeep` 파일 제거

### T2. 동의 페이지 UI 구현
- **우선순위**: P0 (핵심 기능)
- **예상 소요**: 45분
- 세부 작업:
  - `app/page.tsx`: 서버 컴포넌트로 기본 틀 작성, `ConsentPage` 클라이언트 컴포넌트 임포트
  - `components/ConsentPage.tsx`: 동의 상태(`agreed`) 관리 `useState` 훅 포함 클라이언트 컴포넌트 구현
  - UI 구성 요소:
    - 헤더: 앱 이름 "DrugCatch", 서비스 한 줄 설명
    - 경고 카드 1: 개인정보 및 민감정보 처리 안내 (주의 아이콘 포함)
    - 경고 카드 2: 전문가 확인 필요 안내 (의료 정보는 참고용임을 명시)
    - 체크박스: "위 내용을 모두 읽고 동의합니다"
    - 버튼: "분석 시작" (체크박스 미체크 시 비활성화, 체크 시 활성화)
    - 버튼 클릭 시: `/upload` 경로로 `router.push` (Sprint 2 구현 전까지 placeholder)
  - 모바일 우선 반응형 레이아웃 (max-w-md, 중앙 정렬)
  - `app/layout.tsx`: `<html lang="ko">` 설정

### T3. Docker 설정
- **우선순위**: P1 (CI 통과 필수)
- **예상 소요**: 20분
- 세부 작업:
  - `docker/frontend/Dockerfile.prod` 작성:
    - 멀티 스테이지 빌드: `deps` → `builder` → `runtime`
    - `runtime` 스테이지: Node.js 22 Alpine, Next.js standalone 출력
    - 환경 변수 `NEXT_PUBLIC_API_URL` ARG 선언 (CI yml에서 전달)
    - `next.config.ts`에 `output: 'standalone'` 설정
  - `docker-compose.yml` 작성 (프로젝트 루트):
    - `frontend` 서비스: `docker/frontend/Dockerfile.prod` 빌드, 포트 3000:3000
    - `backend` 서비스: `docker/backend/Dockerfile.prod` 빌드 placeholder (Sprint 3에서 완성)

### T4. ESLint / TypeScript 오류 해소
- **우선순위**: P1
- **예상 소요**: 10분
- 세부 작업:
  - `npm run lint` 통과 확인
  - `npm run build` 로컬 빌드 성공 확인
  - TypeScript `any` 타입 미사용 확인

---

## 5. 의존성 및 리스크

| 리스크 | 가능성 | 대응 방안 |
|--------|--------|----------|
| Next.js 15 + TailwindCSS 4 설정 충돌 | 중 | 공식 `create-next-app` 템플릿 사용으로 호환성 보장 |
| Docker 멀티 스테이지 빌드 시 `node_modules` 누락 | 중 | standalone 출력 + `public`, `.next/static` 복사 단계 명시 |
| CI에서 `docker/frontend/Dockerfile.prod` 경로 불일치 | 저 | ci.yml의 `docker build -f docker/frontend/Dockerfile.prod` 경로와 일치하여 생성 |
| `frontend/.gitkeep` 파일 충돌 | 저 | 프로젝트 초기화 전 `.gitkeep` 삭제 |

---

## 6. 완료 기준 (Definition of Done)

### 기능 완료 기준

- ✅ 루트 경로(`/`) 접속 시 동의 페이지가 렌더링된다
- ✅ 체크박스 미체크 상태에서 "분석 시작" 버튼이 비활성화(disabled)된다
- ✅ 체크박스 체크 후 "분석 시작" 버튼이 활성화된다
- ✅ 버튼 클릭 시 `/upload` 경로로 라우팅 시도가 발생한다 (404 허용 — Sprint 2 미구현)
- ✅ 모바일 화면(375px)에서 레이아웃이 깨지지 않는다

### 기술 완료 기준

- ✅ `npm run build` 로컬 빌드 성공
- ✅ `npm run lint` ESLint 오류 없음
- ✅ `docker build -f docker/frontend/Dockerfile.prod --target runtime -t app-frontend:test .` 성공 (CI에서 검증)
- ✅ `docker-compose.yml`에서 `docker compose up --build` 정상 기동 (CI에서 검증)
- ✅ CI 워크플로우 (`ci.yml`) Docker 빌드 확인 단계 통과

### 문서 완료 기준

- ✅ `docs/sprint/sprint1.md` 계획 문서 존재
- ✅ ROADMAP.md의 Sprint 1 상태가 진행 중으로 표시됨

---

## 7. 검증 방법

### 로컬 수동 검증

```bash
# 1. Next.js 개발 서버 기동
cd frontend && npm run dev
# → http://localhost:3000 접속, 동의 페이지 확인

# 2. 프로덕션 빌드 확인
cd frontend && npm run build

# 3. Docker 빌드 확인 (프로젝트 루트에서)
docker build -f docker/frontend/Dockerfile.prod --target runtime -t app-frontend:test .

# 4. docker-compose 전체 기동 확인
docker compose up --build
# → http://localhost:3000 접속, 동의 페이지 확인
```

### 체크리스트 (UI 시각 검증)

- ✅ 앱 제목 "DrugCatch" 표시 확인
- ✅ 개인정보 처리 안내 텍스트 확인
- ✅ 전문가 확인 안내 텍스트 확인
- ✅ 체크박스 + 레이블 표시 확인
- ✅ 버튼 비활성화/활성화 상태 전환 확인

### CI 자동 검증

PR 생성 시 `.github/workflows/ci.yml`이 자동으로 다음을 검증합니다:

- `docker/frontend/Dockerfile.prod` 존재 확인 및 Docker 빌드 테스트
- 환경 변수 `NEXT_PUBLIC_API_URL=http://localhost:8000` 주입 확인

---

## 8. 예상 산출물

| 파일 | 설명 |
|------|------|
| `frontend/app/page.tsx` | 동의 페이지 서버 컴포넌트 |
| `frontend/app/layout.tsx` | 루트 레이아웃 (lang="ko") |
| `frontend/app/globals.css` | TailwindCSS 전역 스타일 |
| `frontend/components/ConsentPage.tsx` | 동의 UI 클라이언트 컴포넌트 |
| `frontend/next.config.ts` | standalone 출력 설정 포함 |
| `frontend/package.json` | Next.js 15, TailwindCSS 의존성 |
| `docker/frontend/Dockerfile.prod` | 멀티 스테이지 프로덕션 빌드 |
| `docker-compose.yml` | 프론트엔드 서비스 포함 compose 파일 |
| `docs/sprint/sprint1.md` | 본 계획 문서 |

---

## 9. 다음 스프린트 연계

Sprint 1 완료 후 Sprint 2에서 다음을 이어받습니다:

- `/upload` 라우트 생성 (동의 페이지 버튼이 라우팅할 대상)
- 이미지 입력 방식 선택 UI (촬영 vs 업로드)
- 이미지 미리보기 컴포넌트
- "이미지 분석 시작" 버튼 및 로딩 인디케이터
