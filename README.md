# DrugCatch

> 처방전 및 약품 사진으로 복약정보를 조회하는 웹 MVP

이미지 입력(촬영 또는 업로드) → OCR/이미지 인식 → 병명·증상·약품 정보 카드 결과 표시까지의 기본 흐름을 구현합니다.

---

## 📁 프로젝트 구조

```
DrugCatch/
├── frontend/                   # Next.js 프론트엔드 (Sprint 1~2)
├── backend/                    # Python 백엔드 - OCR/이미지 인식 (Sprint 3~4)
├── .claude/
│   ├── agents/             # Claude 에이전트 정의
│   │   ├── sprint-planner.md   # 스프린트 계획 수립 에이전트
│   │   ├── sprint-close.md     # 스프린트 마무리 에이전트
│   │   ├── hotfix-close.md     # 핫픽스 마무리 에이전트
│   │   ├── deploy-prod.md      # 프로덕션 배포 에이전트
│   │   └── prd-to-roadmap.md   # PRD → ROADMAP 변환 에이전트
│   ├── commands/
│   │   └── restart.md          # /restart 슬래시 커맨드
│   ├── agent-memory/           # 에이전트 영구 메모리
│   │   ├── sprint-planner/
│   │   └── prd-to-roadmap/
│   └── settings.json           # Claude 권한 설정
├── .github/
│   └── workflows/
│       ├── ci.yml              # PR 체크 (pytest, Docker 빌드)
│       └── deploy.yml          # main merge 시 프로덕션 배포
├── docs/
│   ├── dev-process.md          # 개발 프로세스 가이드 (Single Source of Truth)
│   ├── ci-policy.md            # CI/CD 정책
│   ├── git-convention.md       # 브랜치·커밋·PR 협업 규칙
│   ├── setup-guide.md          # 환경 설정 가이드
│   ├── sprint/                 # 스프린트 계획/완료 문서
│   └── deploy-history/         # 배포/검증 기록 아카이브
├── CLAUDE.md                   # Claude Code 프로젝트 지시 파일
├── ROADMAP.md                  # 프로젝트 로드맵
├── LICENSE                     # MIT 라이선스
├── deploy.md                   # 현재 미완료 수동 작업 목록
└── .env.example                # 환경변수 템플릿
```

---

## 🤖 Claude 에이전트 설명

이 프로젝트는 5개의 특화된 Claude 에이전트를 포함합니다.

### 1. sprint-planner
**트리거**: 새 스프린트 계획 수립 시

ROADMAP.md를 분석하고 writing-plans 스킬을 참조하여 실행 가능한 스프린트 계획을 자동으로 수립합니다.

```
사용자: "다음 스프린트에서 사용자 인증 기능을 구현하고 싶어"
→ sprint-planner 에이전트가 ROADMAP.md를 분석하여 docs/sprint/sprint{N}.md 생성
```

### 2. sprint-close
**트리거**: 스프린트 구현 완료 후

스프린트 마무리 작업 전체를 자동화합니다:
1. ROADMAP.md 상태 업데이트 (`🔄 진행 중` → `✅ 완료`)
2. `develop` 브랜치로 PR 생성
3. 코드 리뷰 (보안/성능/품질 체크리스트)
4. 자동 검증 실행 (pytest, API curl, Playwright UI)
5. deploy.md 업데이트 + 기록 아카이빙
6. sprint-planner 메모리 업데이트

```
사용자: "sprint 3 구현 끝났어. 마무리 작업 해줘"
→ sprint-close 에이전트가 PR 생성부터 검증까지 자동 처리
```

### 3. hotfix-close
**트리거**: 핫픽스 구현 완료 후

sprint-close의 경량 버전. ROADMAP 업데이트 없이 `main` 브랜치로 직접 PR을 생성합니다.

```
사용자: "hotfix 마무리 해줘"
→ hotfix-close 에이전트가 main PR 생성, 타겟 검증, develop 역머지 안내
```

### 4. deploy-prod
**트리거**: develop 브랜치 QA 완료 후 프로덕션 배포 시

`develop` → `main` PR 생성, 사전 점검, 배포 후 실서버 검증을 수행합니다.

```
사용자: "develop 검증 완료됐어. 프로덕션 배포 해줘"
→ deploy-prod 에이전트가 PR 생성, 헬스체크, 컨테이너 상태 검증
```

### 5. prd-to-roadmap
**트리거**: PRD 문서가 있을 때 ROADMAP.md 생성 시

PRD(제품 요구사항 문서)를 분석하여 Agile/스크럼 방법론에 기반한 ROADMAP.md를 자동 생성합니다.

```
사용자: "docs/PRD.md 기반으로 ROADMAP 만들어줘"
→ prd-to-roadmap 에이전트가 Phase/Sprint 구조의 ROADMAP.md 생성
```

---

## 🔄 개발 워크플로우

### Sprint 흐름

```
1. sprint-planner → docs/sprint/sprint{N}.md 생성
2. git checkout -b sprint{N}
3. 구현 작업...
4. sprint-close → develop PR + 검증
5. QA 통과 후 deploy-prod → main 배포
```

### Hotfix 흐름

```
1. git checkout -b hotfix/{설명} (main 기반)
2. 긴급 수정...
3. hotfix-close → main PR + 타겟 검증 + develop 역머지 안내
```

자세한 내용은 `docs/dev-process.md` 참조.

---

## ⚙️ 설정 방법

### 1. 로컬 개발 환경 설정

1. `docs/setup-guide.md` 가이드에 따라 로컬 환경을 구성합니다.
2. `.env.example`을 복사하여 `.env` 생성 후 값 입력합니다.
3. `docs/dev-process.md` 섹션 6.3에 실서버 SSH 접속 정보를 기입합니다.
4. `.github/workflows/deploy.yml`에서 이미지명 플레이스홀더 (`YOUR_GITHUB_ORG`, `YOUR_PROJECT`) 를 변경합니다.
5. GitHub Secrets 설정 (`LIGHTSAIL_SSH_KEY`, `LIGHTSAIL_HOST`, 등)

### 2. CLAUDE.md 커스터마이징

CLAUDE.md는 Claude Code가 이 프로젝트에서 작동하는 방식을 정의합니다:
- **언어 규칙**: 한국어 응답, 코드 주석, 커밋 메시지
- **Git 브랜치 전략**: Sprint/Hotfix 흐름
- **의사결정 기준**: Hotfix vs Sprint 자동 분류
- **Notion 연동**: 문서 관리 규칙 (선택사항)

### 3. 에이전트 메모리

`.claude/agent-memory/` 디렉토리의 `MEMORY.md` 파일들은 에이전트가 세션 간 지식을 축적하는 데 사용됩니다. 이 파일들은 버전 관리되므로 팀 전체가 공유합니다.

---

## 📋 슬래시 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/restart` | Docker Compose 서비스 재시작 |

---

## 🔧 GitHub Actions

### CI (`.github/workflows/ci.yml`)

PR이 `develop` 또는 `main`으로 올라오면 자동 실행:
- 백엔드 pytest 테스트
- Docker 이미지 빌드 검증

### CD (`.github/workflows/deploy.yml`)

`main`에 push되면 자동 실행:
- Docker 이미지 빌드 & GHCR push
- SSH를 통한 프로덕션 서버 배포

> 이미지명: `ghcr.io/mailtome7072/drugcatch-{backend|frontend|nginx}` · 서버: GitHub Secrets(`LIGHTSAIL_HOST`) 참조

---

## 📚 참고 문서

- `docs/dev-process.md` — 개발 프로세스 전체 가이드
- `docs/ci-policy.md` — CI/CD 정책 상세
- `docs/setup-guide.md` — 환경 설정 가이드
- `ROADMAP.md` — 프로젝트 로드맵
