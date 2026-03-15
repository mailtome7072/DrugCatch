# 배포 후 수동 작업 가이드

> **목적**: 현재 완료되지 않은 수동 검증/작업 항목만 유지합니다.
> 완료된 기록은 `docs/deploy-history/YYYY-MM-DD.md`로 이동됩니다.

---

## 현재 미완료 항목

### Sprint 2 — 이미지 업로드 UI (2026-03-15)

- ✅ `npm run lint` 통과
- ✅ `npm run build` 통과 (`/upload` 라우트 정상 생성)
- ✅ `/upload` HTTP 200 응답 확인 (curl)
- ✅ `/` 메인 페이지 HTTP 200 응답 확인 (curl)
- ✅ `/not-exist` HTTP 404 응답 확인 (curl)
- ⬜ Playwright UI 검증 미수행 — playwright 패키지 미설치. 다음 항목 브라우저에서 수동 확인 필요:
  - ⬜ `/upload` 경로 접속 시 업로드 페이지 렌더링 확인
  - ⬜ "카메라 촬영" / "파일 선택" 탭 버튼 표시 확인
  - ⬜ 탭 전환 시 버튼 강조 스타일 변경 확인
  - ⬜ 파일 선택 후 미리보기 이미지 표시 확인
  - ⬜ "다시 선택" 버튼으로 미리보기 초기화 확인
  - ⬜ 이미지 없을 때 "이미지 분석 시작" 버튼 비활성화 확인
  - ⬜ 이미지 있을 때 버튼 활성화 확인
  - ⬜ 버튼 클릭 시 2초간 로딩 스피너 표시 확인
  - ⬜ 잘못된 파일 형식 선택 시 에러 메시지 표시 확인
  - ⬜ 모바일 화면(375px) 레이아웃 확인
- ⬜ Docker 빌드 검증 — `docker build -f docker/frontend/Dockerfile.prod --target runtime -t app-frontend:test .` 성공 확인
- ⬜ CI 워크플로우 Docker 빌드 통과 확인 — develop PR 머지 전 GitHub Actions CI 결과 확인

---

## 참고

- 검증 원칙: `docs/dev-process.md` 섹션 5
- 배포 이력: `docs/deploy-history/`
- 롤백 방법: `docs/dev-process.md` 섹션 6.4
