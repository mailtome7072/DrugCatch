# choiji-guide-big

Claude Code 설정 예제 + 개발 프로세스 템플릿 프로젝트입니다.

## 저장소

- **원격 저장소**: [https://github.com/frogy95/choiji-guide-big.git](https://github.com/frogy95/choiji-guide-big.git)

## 언어 및 커뮤니케이션 규칙

- 기본 응답 언어: 한국어
- 코드 주석: 한국어로 작성
- 커밋 메시지: 한국어로 작성
- 문서화: 한국어로 작성
- 변수명/함수명: 영어 (코드 표준 준수)

## Git 브랜치 전략

### Sprint 흐름 (기능 개발)
```
sprint{n}  →  PR to develop  →  로컬 Docker 스테이징 검증  →  PR to main  →  서버 자동 배포
```

### Hotfix 흐름 (긴급 패치)
```
hotfix/*  →  PR to main  →  서버 자동 배포  →  main을 develop에 역머지
```

- `sprint{n}`: 스프린트 단위 개발 브랜치
- `develop`: 스테이징 통합 브랜치 (로컬 Docker로 검증)
- `main`: 프로덕션 브랜치 (GitHub Actions → 서버 자동 배포)
- `hotfix/*`: 긴급 운영 패치 (main 기반 분기, main PR 후 develop 역머지)

자세한 CI/CD 정책은 `docs/ci-policy.md` 참조. 개발 프로세스 전체는 `docs/dev-process.md` 참조.

## Bash 명령 실행 규칙

- Bash 명령 실행 시 `cd /path &&` 접두사를 사용하지 마세요. 작업 디렉토리가 이미 프로젝트 루트로 설정되어 있습니다.
- 특히 git 명령은 반드시 `git ...` 형태로 직접 실행하세요. (`cd ... && git ...` 금지)

## 개발시 유의해야할 사항

- **plan 모드에서 수정사항을 받으면 반드시 Hotfix vs Sprint 의사결정을 먼저 수행합니다:**
  1. 수정사항의 긴급도, 변경 범위, DB 변경 여부, 의존성 추가 여부를 분석합니다.
  2. 아래 기준에 따라 Hotfix 또는 Sprint를 추천합니다.
  3. 사용자의 최종 결정을 받은 후 해당 프로세스를 따릅니다.

  **Hotfix 추천 기준** (모두 충족 시):
  - 프로덕션 장애/버그이거나, 변경 범위가 파일 3개 이하 & 코드 50줄 이하
  - DB 스키마 변경 없음
  - 새 의존성(pip/npm) 추가 없음

  **Sprint 추천 기준** (하나라도 해당 시):
  - 새 기능 추가 또는 여러 모듈에 걸친 작업
  - DB 스키마 변경 필요
  - 새 의존성 추가 필요
  - 파일 4개 이상 또는 코드 50줄 초과 변경

- sprint 관련 문서 구조:
  - 스프린트 계획/완료 문서: `docs/sprint/sprint{n}.md`
  - 스프린트 첨부 파일 (스크린샷, 보고서 등): `docs/sprint/sprint{n}/`
- sprint 개발이 plan 모드로 진행될 때는 다음을 꼭 준수합니다.
  - karpathy-guidelines skill을 준수하세요.
  - sprint 가 새로 시작될 때는 새로 branch를 sprint{n} 이름으로 생성하고 해당 브랜치에서 작업해주세요. (worktree 사용하지 말아주세요)
  - 다음과 같이 agent를 활용합니다.
    1. sprint-planner agent가 계획 수립 작업을 수행하도록 해주세요.
    2. 구현/검증 단계에서는 각 task의 내용에 따라 적절한 agent가 있는지 확인 한 후 적극 활용해주세요.
    3. 스프린트 구현이 완료되면 sprint-close agent를 사용하여 마무리 작업(ROADMAP 업데이트, PR 생성, 코드 리뷰, 자동 검증)을 수행해주세요.
    4. sprint-close agent는 **`develop` 브랜치로 PR**을 생성합니다. (main이 아닌 develop)
    5. `develop` → `main` merge는 별도 QA 통과 후 deploy-prod agent를 사용합니다.

- hotfix 개발이 plan 모드로 진행될 때는 다음을 꼭 준수합니다.
  - karpathy-guidelines skill을 준수하세요.
  - `main` 기반으로 `hotfix/{설명}` 브랜치를 생성합니다. (worktree 사용하지 말아주세요)
  - sprint-planner agent는 사용하지 않습니다. (계획 수립 불필요)
  - 구현 완료 후 hotfix-close agent를 사용하여 마무리 작업(PR to main, 경량 검증, deploy.md 기록, develop 역머지 안내)을 수행합니다.
  - ROADMAP.md 업데이트나 sprint 문서 작성은 불필요합니다.
  - 프로덕션 배포는 main merge 시 GitHub Actions가 자동 수행합니다.
  - 배포 후 실서버 검증이 필요하면 deploy-prod agent의 5단계(실서버 자동 검증)를 참조합니다.

- 검증 원칙 상세: `docs/dev-process.md` 섹션 5 참조
- 배포 후 수동 작업: `deploy.md` 참조 (완료 기록은 `docs/deploy-history/` 아카이브)
- 체크리스트 작성 형식:
  - 완료 항목: `- ✅ 항목 내용`
  - 미완료 항목: `- ⬜ 항목 내용`
  - GFM `[x]`/`[ ]` 대신 이모지를 사용하여 마크다운 미리보기에서 시각적 구분을 보장합니다.

## Notion 기술 문서 관리

- **Notion 루트 페이지**: (새 프로젝트 시작 시 설정 필요)
- **업데이트 원칙**: 사용자가 지시할 때 프로젝트 진행 상황에 맞춰 Notion 문서를 업데이트합니다.
- **업데이트 트리거**: `docs/dev-process.md` 섹션 8.5 참조
