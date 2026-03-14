# 개발 프로세스 가이드

> **Single Source of Truth** — 검증 원칙, 개발 워크플로우, QA 기준이 이 문서 한 곳에 정의됩니다.
> CLAUDE.md, agent 파일, ci-policy.md는 이 문서를 참조합니다.

---

## 1. Git 브랜치 전략

인프라 상세 정책은 [`docs/ci-policy.md`](ci-policy.md) 참조.

| 브랜치 | 역할 | 배포 환경 |
|--------|------|----------|
| `sprint{n}` | 스프린트 단위 개발 | 로컬 |
| `develop` | 스테이징 통합 브랜치 | 로컬 Docker |
| `main` | 프로덕션 브랜치 | 프로덕션 서버 |
| `hotfix/*` | 긴급 운영 패치 | main + develop 역머지 |

### Sprint 흐름

```
sprint{n}  →  PR to develop  →  로컬 Docker 스테이징 검증  →  PR to main  →  서버 자동 배포
```

### Hotfix 흐름

```
hotfix/*  →  PR to main  →  서버 자동 배포  →  main을 develop에 역머지
```

---

## 2. Hotfix vs Sprint 의사결정

### Hotfix 추천 기준 (모두 충족 시)

- 프로덕션 장애/버그
- 변경 범위: 파일 3개 이하 & 코드 50줄 이하
- DB 스키마 변경 없음
- 새 의존성(pip/npm) 추가 없음

### Sprint 추천 기준 (하나라도 해당 시)

- 새 기능 추가 또는 여러 모듈에 걸친 작업
- DB 스키마 변경 필요
- 새 의존성 추가 필요
- 파일 4개 이상 또는 코드 50줄 초과 변경

---

## 3. Sprint 프로세스

### 3.1 계획 (sprint-planner agent)

- ROADMAP.md를 참조하여 스프린트 번호와 목표를 확인
- `docs/sprint/sprint{N}.md` 계획 문서 생성
- karpathy-guidelines skill 준수

### 3.2 구현

- `sprint{N}` 브랜치 생성 후 작업 (worktree 사용 금지)
- 브랜치 생성: `git checkout -b sprint{N}`

### 3.3 마무리 (sprint-close agent)

1. ROADMAP.md 상태 업데이트 (`🔄 진행 중` → `✅ 완료`)
2. sprint{N} → **develop** PR 생성 (main이 아닌 develop)
3. 섹션 7 체크리스트에 따라 코드 리뷰 수행
4. 섹션 5 검증 매트릭스의 "Sprint" 컬럼 기준으로 자동 검증 실행
5. `docs/deploy-history/YYYY-MM-DD.md`에 이전 완료 기록 이동 후 deploy.md 업데이트
6. Notion 업데이트 필요 여부 사용자에게 안내 (섹션 8.5 기준)

> **참고**: `develop` → `main` merge는 별도 QA 통과 후 deploy-prod agent를 사용합니다.

---

## 4. Hotfix 프로세스

### 4.1 구현

- `main` 기반으로 `hotfix/{설명}` 브랜치 생성 (worktree 사용 금지)
- sprint-planner agent 사용하지 않음

### 4.2 마무리 (hotfix-close agent)

1. hotfix/* → **main** PR 생성
2. 변경 파일만 대상으로 경량 코드 리뷰
3. 섹션 5 검증 매트릭스의 "Hotfix" 컬럼 기준으로 타겟 검증 실행
4. `docs/deploy-history/YYYY-MM-DD.md`에 이전 기록 이동 후 deploy.md 업데이트
5. develop 역머지 안내

---

## 5. 검증 매트릭스 (Single Source of Truth)

| 검증 항목 | Sprint | Hotfix | deploy-prod | 자동/수동 |
|-----------|--------|--------|-------------|----------|
| `pytest -v` (백엔드 통합 테스트) | ✅ | ✅ | — | **자동** |
| API curl/httpx 검증 | ✅ 전체 | ✅ 변경분만 | — | **자동** |
| 데모 모드 API 검증 | ✅ | — | — | **자동** |
| Playwright UI 검증 | ✅ 전체 | ✅ 변경분만 | ✅ 접속만 | **자동** |
| SSH 헬스체크 (`/api/v1/health`) | — | — | ✅ | **자동** |
| Docker 컨테이너 상태 확인 | — | — | ✅ | **자동** |
| 백엔드 로그 오류 확인 | — | — | ✅ | **자동** |
| `docker compose up --build` | ⬜ | ⬜ | — | **수동** |
| `alembic upgrade head` | ⬜ DB변경시 | — | ⬜ DB변경시 | **수동** |
| UI 디자인/시각적 품질 판단 | ⬜ | — | ⬜ | **수동** |

### 자동 검증 전제 조건

- Docker 컨테이너가 실행 중일 때만 자동 실행
- 서버가 응답하는지 확인 후 진행 (`http://localhost:3000`, `http://localhost:8000`)
- Docker가 미실행인 경우: 자동 검증을 건너뛰고, deploy.md에 "⬜ Docker 미실행으로 자동 검증 미수행" 기록 후 수동 검증 항목으로 안내

### 검증 결과 기록

- 자동 검증 결과는 deploy.md에 즉시 기록
- 스크린샷은 `docs/sprint/sprint{N}/` 폴더에 저장
- `✅ 자동 검증 완료` / `⬜ 수동 검증 필요` 구분 표시

---

## 6. 배포 프로세스

### 6.1 로컬 스테이징 (develop 브랜치 + Docker)

```bash
git pull origin develop
docker compose up --build
```

### 6.2 프로덕션 배포 (deploy-prod agent)

1. develop 브랜치 CI 통과 확인
2. develop → main PR 생성
3. GitHub Actions 자동 배포 (GHCR 이미지 빌드 → 서버 SSH 배포)
4. 실서버 자동 검증 (5단계: SSH 헬스체크, 컨테이너 상태, 로그, Playwright)

### 6.3 실서버 검증 (SSH 접속 정보)

> TODO: 프로젝트 배포 서버 정보를 이 섹션에 기입하세요.

- **키**: `{SSH_KEY_PATH}` (프로젝트 루트)
- **호스트**: `{USER}@{SERVER_IP}` (AWS Lightsail 또는 다른 서버)
- **앱 경로**: `{APP_PATH}`

```bash
# 헬스체크
curl -s http://{SERVER_IP}/api/v1/health

# 컨테이너 상태
ssh -i {SSH_KEY_PATH} {USER}@{SERVER_IP} \
  "cd {APP_PATH} && sudo docker compose -f docker-compose.prod.yml ps"

# 백엔드 로그 오류 확인
ssh -i {SSH_KEY_PATH} {USER}@{SERVER_IP} \
  "cd {APP_PATH} && sudo docker compose -f docker-compose.prod.yml logs backend --tail 30 2>&1 | grep -i 'error\|traceback\|critical' || echo 'No errors found'"
```

### 6.4 롤백 시나리오

#### A. 코드만 롤백 (이미지 태그 변경)

```bash
# 이전 버전 태그 확인
git log --oneline main -5

# 서버 SSH 접속 후
ssh -i {SSH_KEY_PATH} {USER}@{SERVER_IP}
cd {APP_PATH}
sudo docker compose -f docker-compose.prod.yml down
sudo docker pull ghcr.io/{GITHUB_ORG}/{PROJECT}-backend:v{이전_버전}
sudo docker pull ghcr.io/{GITHUB_ORG}/{PROJECT}-frontend:v{이전_버전}
sudo docker compose -f docker-compose.prod.yml up -d
```

#### B. DB 포함 롤백 (주의: 데이터 손실 가능)

```bash
# 롤백 전 반드시 DB 백업
ssh -i {SSH_KEY_PATH} {USER}@{SERVER_IP} \
  "cd {APP_PATH} && sudo docker compose -f docker-compose.prod.yml exec postgres pg_dump -U {DB_USER} {DB_NAME} > /tmp/backup_$(date +%Y%m%d).sql"

# Alembic 다운그레이드
ssh -i {SSH_KEY_PATH} {USER}@{SERVER_IP} \
  "cd {APP_PATH} && sudo docker compose -f docker-compose.prod.yml exec backend alembic downgrade -1"
```

#### C. 긴급 서비스 중단

```bash
ssh -i {SSH_KEY_PATH} {USER}@{SERVER_IP} \
  "cd {APP_PATH} && sudo docker compose -f docker-compose.prod.yml down"

# 원인 조사 후 서비스 복구
ssh -i {SSH_KEY_PATH} {USER}@{SERVER_IP} \
  "cd {APP_PATH} && sudo docker compose -f docker-compose.prod.yml up -d"
```

---

## 7. 코드 리뷰 체크리스트

sprint-close agent의 4단계 및 hotfix-close agent의 3단계에서 이 체크리스트를 사용합니다.

### 보안

- [ ] 하드코딩된 시크릿, API 키, 비밀번호 없음
- [ ] SQL 인젝션 방지 (ORM 파라미터 바인딩 사용)
- [ ] XSS 방지 (React 기본 이스케이프 사용, 인라인 HTML 주입 최소화)
- [ ] 인증/인가 체크 누락 없음

### 성능

- [ ] N+1 쿼리 없음 (SQLAlchemy relationship 로딩 전략 확인)
- [ ] 불필요한 API 호출 없음
- [ ] 리스트 응답에 페이지네이션 적용

### 코드 품질

- [ ] TypeScript 타입 안전성 (any 사용 최소화)
- [ ] 에러 핸들링 (FastAPI HTTPException, 프론트엔드 에러 바운더리)
- [ ] 구조화 로깅 (JSON 형식, Request ID 포함)

### 테스트

- [ ] 새 기능에 pytest 테스트 추가 여부
- [ ] 기존 테스트 회귀 없음 (`pytest -v` 통과)

### 패턴 준수

- [ ] 프로젝트 컨벤션에 맞는 파일/디렉토리 구조
- [ ] API 클라이언트 추상화 레이어 사용

---

## 8. 문서 관리 규칙

### 8.1 deploy.md

- **목적**: 현재 미완료 수동 검증 항목만 유지
- sprint-close/hotfix-close 완료 시 이전 완료 기록은 `docs/deploy-history/YYYY-MM-DD.md`로 이동
- 체크리스트는 GFM `[x]`/`[ ]` 대신 이모지(`✅`/`⬜`)를 사용합니다.

### 8.2 docs/deploy-history/

- 날짜별 배포/검증 기록 아카이브
- 파일명: `YYYY-MM-DD.md` (해당 날짜의 모든 기록)

### 8.3 docs/setup-guide.md

- 초기 환경 설정 가이드 (외부 서비스 API, 개발 도구, 환경변수)
- 프로젝트 시작 시 1회 수행 항목

### 8.4 Sprint 문서

- 계획/완료 문서: `docs/sprint/sprint{N}.md`
- 첨부 파일 (스크린샷, 보고서): `docs/sprint/sprint{N}/`

### 8.5 Notion 업데이트 트리거

| 변경 유형 | 업데이트 페이지 |
|-----------|----------------|
| 새 버전 배포 | 릴리즈 노트 (최상단 추가) |
| DB 스키마 변경 | 데이터 모델 |
| API 변경/추가 | API 명세 |
| 새 기능 추가 | 기능 명세 |
| 아키텍처 변경 | 시스템 아키텍처 (Mermaid 다이어그램 포함) |

사용자가 지시할 때 업데이트합니다. sprint-close agent는 해당되는 Notion 페이지 업데이트 필요 여부를 안내합니다.

### 8.6 문서 최신화 트리거

| 변경 사항 | 업데이트 대상 | 담당 |
|-----------|--------------|------|
| 새 스프린트 완료 | `sprint-planner MEMORY.md`의 스프린트 현황 | sprint-close agent |
| 검증 원칙 변경 | `docs/dev-process.md` 섹션 5 | 직접 수정 |
| 환경변수/의존성 추가 | `docs/setup-guide.md` | 해당 스프린트 작업자 |
| 에이전트 워크플로우 변경 | `.claude/agents/*.md` 해당 파일 | 직접 수정 |
| 새 버전 배포 | Notion 릴리즈 노트 (섹션 8.5 참조) | deploy-prod agent |
| 스프린트 추가/완료 | `ROADMAP.md` 상태 업데이트 | sprint-close agent |
| DB/API/기능 변경 시 Notion | 섹션 8.5 트리거 참조 | sprint-close agent |
