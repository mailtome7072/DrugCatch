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

`backend/.env` 파일을 직접 생성합니다 (`.gitignore` 적용 — git에 올라가지 않음):

```bash
# backend/.env
DRUG_API_KEY=<식약처 API 키>
ANTHROPIC_API_KEY=<Anthropic API 키>
```

| 환경변수 | 필수 여부 | 설명 | 발급처 |
|----------|-----------|------|--------|
| `DRUG_API_KEY` | 필수 | 식약처 의약품 개요 정보 API 키 | [공공데이터포털](https://www.data.go.kr) — `DrbEasyDrugInfoService` 신청 |
| `ANTHROPIC_API_KEY` | 선택 | Claude Vision API 키 (알약 직접 촬영 이미지 분석) | [console.anthropic.com](https://console.anthropic.com) — `sk-ant-api03-...` 형식 |

> `ANTHROPIC_API_KEY` 미설정 시 처방전/약봉투 분석은 정상 동작하며, 알약 직접 촬영 이미지에서만 약품 0건 반환됩니다.

---

## 4. 로컬 개발 환경 실행

### 방법 A — Docker Compose (권장)

```bash
# 전체 스택 한 번에 실행 (Tesseract 포함)
docker compose up --build
```

### 방법 B — 개별 실행

#### 백엔드 (FastAPI)

먼저 Tesseract OCR을 시스템에 설치해야 합니다:

```bash
# macOS
brew install tesseract tesseract-lang

# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-kor
```

Python 의존성 설치 및 서버 실행:

```bash
pip install -r backend/requirements.txt
PYTHONPATH=backend uvicorn main:app --reload --port 8000 --app-dir backend
```

#### 프론트엔드 (Next.js)

```bash
cd frontend
npm install
npm run dev
```

서비스 접속:
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서 (Swagger): http://localhost:8000/docs

---

## 5. 외부 서비스 설정

### 식약처 공공데이터 API

1. [공공데이터포털](https://www.data.go.kr) 회원가입
2. `의약품 개요정보 조회 서비스 (DrbEasyDrugInfoService)` 검색 후 활용 신청
3. 승인 후 발급된 서비스 키를 `backend/.env`의 `DRUG_API_KEY`에 입력
4. 승인까지 보통 1~2 영업일 소요

### Anthropic API (Claude Vision)

1. [console.anthropic.com](https://console.anthropic.com) 에서 API 키 발급
2. `sk-ant-api03-...` 형식의 키를 `backend/.env`의 `ANTHROPIC_API_KEY`에 입력
3. 알약 직접 촬영 이미지 분석에만 사용됨. 미설정 시 해당 기능만 비활성화됨.

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
