# 배포 후 수동 작업 가이드

> **목적**: 현재 완료되지 않은 수동 검증/작업 항목만 유지합니다.
> 완료된 기록은 `docs/deploy-history/YYYY-MM-DD.md`로 이동됩니다.

---

## 현재 미완료 항목

### Sprint 1 — 사용자 동의 UI (2026-03-15)

- ✅ `npm run lint` 통과
- ✅ `npm run build` 통과 (standalone 출력 확인)
- ⬜ Docker 미실행으로 자동 검증 미수행 — `docker compose up --build` 후 http://localhost:3000 접속 수동 확인 필요
- ⬜ UI 시각적 품질 확인 — 브라우저에서 다음 항목 수동 검증 필요:
  - ⬜ 앱 제목 "DrugCatch" 표시 확인
  - ⬜ 개인정보 처리 안내 텍스트 확인
  - ⬜ 전문가 확인 안내 텍스트 확인
  - ⬜ 체크박스 + 레이블 표시 확인
  - ⬜ 버튼 비활성화/활성화 상태 전환 확인
  - ⬜ 모바일 화면(375px) 레이아웃 확인
- ⬜ CI 워크플로우 Docker 빌드 통과 확인 — PR 머지 전 GitHub Actions CI 결과 확인

---

## 참고

- 검증 원칙: `docs/dev-process.md` 섹션 5
- 배포 이력: `docs/deploy-history/`
- 롤백 방법: `docs/dev-process.md` 섹션 6.4
