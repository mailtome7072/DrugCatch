# 환경 설정 가이드

> 프로젝트 최초 시작 시 1회 수행하는 환경 설정 가이드입니다.

---

## 1. 사전 요구사항

- [ ] Git
- [ ] Docker Desktop
- [ ] Node.js 20 LTS 이상
- [ ] Python 3.11 이상

---

## 2. 저장소 클론

```bash
git clone https://github.com/mailtome7072/DrugCatch.git
cd DrugCatch
```

---

## 3. 환경변수 설정

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env
```

`.env` 파일을 열고 필요한 값을 입력합니다:

| 환경변수 | 설명 | 예시 |
|----------|------|------|
| `NEXT_PUBLIC_API_URL` | 프론트엔드에서 호출하는 백엔드 API URL | `http://localhost:8000` |
| `JWT_SECRET` | JWT 서명 키 (로컬 개발 시 임의 문자열 사용 가능) | `dev-secret-key` |
| `SECRET_KEY` | 앱 시크릿 키 (로컬 개발 시 임의 문자열 사용 가능) | `dev-app-secret` |

---

## 4. 로컬 개발 환경 실행

```bash
# Docker Compose로 전체 스택 실행
docker compose up --build
```

서비스 접속:
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

---

## 5. 외부 서비스 설정

MVP 단계에서는 DB 없이 정적 JSON 또는 공공 API를 활용합니다.
별도의 외부 서비스 설정은 불필요합니다.

> 공공 API 연동 시 별도 API 키가 필요할 수 있습니다. 해당 시점에 이 섹션을 업데이트합니다.

---

## 6. 개발 도구 설정

### VS Code 권장 익스텐션

| 익스텐션 | ID |
|----------|----|
| ESLint | `dbaeumer.vscode-eslint` |
| Prettier | `esbenp.prettier-vscode` |
| Python | `ms-python.python` |
| Docker | `ms-azuretools.vscode-docker` |
| GitLens | `eamodio.gitlens` |

---

## 7. Claude Code 설정

이 프로젝트는 Claude Code와 함께 사용하도록 설계되었습니다.

### 전제 조건

- Claude Code 설치: https://claude.ai/claude-code
- MCP 서버 설정 (선택사항): Playwright, Notion 등

### 에이전트 활용

- `sprint-planner`: 스프린트 계획 수립
- `sprint-close`: 스프린트 마무리 (PR, 코드 리뷰, 검증)
- `hotfix-close`: 핫픽스 마무리
- `deploy-prod`: 프로덕션 배포
- `prd-to-roadmap`: PRD → ROADMAP.md 변환

자세한 내용은 `README.md` 참조.
