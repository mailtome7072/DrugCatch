# Sprint Planner 메모리

이 파일은 sprint-planner 에이전트의 영구 메모리입니다.
프로젝트 진행 상황, 기술 스택, 패턴 등을 기록합니다.

---

## 스프린트 현황

| 스프린트 | 목표 | 상태 | 완료일 | 브랜치 |
|----------|------|------|--------|--------|
| Sprint 1 | 사용자 동의 UI, Next.js 프로젝트 초기화 | ✅ 완료 | 2026-03-15 | sprint1 |
| Sprint 2 | 이미지 입력 방식 선택, 미리보기, 분석 시작 버튼 | 📋 예정 | — | sprint2 (미생성) |
| Sprint 3 | OCR/이미지 인식 백엔드 모듈 | 📋 예정 | — | sprint3 (미생성) |
| Sprint 4 | 프론트-백엔드 연동, 결과 화면 UI | 📋 예정 | — | sprint4 (미생성) |

**다음 사용 가능한 스프린트 번호: Sprint 2**

---

## 기술 스택 현황

### Frontend
- Next.js 16 + TypeScript + TailwindCSS + App Router
- `output: 'standalone'` 설정 (Docker 경량 배포)
- 패키지 매니저: npm

### Docker
- 멀티 스테이지 빌드: `deps → builder → runtime`
- Node.js 22 Alpine 기반
- `docker/frontend/Dockerfile.prod` — CI/CD 참조 경로

### 디렉토리 구조
```
frontend/
├── app/          # Next.js App Router 페이지
├── components/   # 공유 컴포넌트
└── public/       # 정적 에셋

docker/
├── frontend/Dockerfile.prod
└── backend/Dockerfile.prod  # Sprint 3에서 구현 예정
```

---

## 핵심 주의사항

- `develop` 브랜치가 원격에 없었으므로 Sprint 1 마무리 시 master 기준으로 신규 생성함 (2026-03-15)
- Sprint 2에서 `/upload` 라우트 구현 시 `frontend/app/upload/page.tsx` 경로 사용
- `docker-compose.yml`의 backend 서비스는 주석 처리 상태 — Sprint 3에서 활성화
- CI yml(`ci.yml`)의 Docker 빌드 경로: `docker/frontend/Dockerfile.prod` (고정)
- Dockerfile.prod의 `deps` 스테이지(`--only=production`)와 `builder` 스테이지(`npm ci`) 이중 설치 구조는 레이어 캐시 최적화 여지 있음 (개선 필요 시 builder 스테이지 단일화 고려)
