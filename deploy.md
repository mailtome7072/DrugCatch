# 배포 후 수동 작업 가이드

> **목적**: 현재 완료되지 않은 수동 검증/작업 항목만 유지합니다.
> 완료된 기록은 `docs/deploy-history/YYYY-MM-DD.md`로 이동됩니다.

---

## 현재 미완료 항목

### Sprint 8 — 프론트엔드 테스트 도입 (2026-03-16)

- ✅ `npm test` — 단위/컴포넌트 테스트 26개 전체 통과 (4 suites, 0 실패)
- ✅ `inferDiseases.test.ts` 7개 테스트 통과
- ✅ `api.test.ts` 5개 테스트 통과
- ✅ `UploadPage.test.tsx` 8개 테스트 통과
- ✅ `ResultPage.test.tsx` 6개 테스트 통과
- ✅ GitHub Actions CI (`ci.yml`) 프론트엔드 단위 테스트 job 추가
- ✅ Playwright E2E 설정 완료 (7개 시나리오, CI 실행)
- ✅ Lighthouse CI GitHub Actions 연동 완료
- ✅ `npm run test:e2e` — 로컬 서버 기동 후 E2E 7개 시나리오 직접 확인
- ✅ `npx lhci autorun` — 로컬에서 LCP/CLS 임계값 충족 여부 확인
- ✅ GitHub Actions CI 실제 실행 결과 확인 (push 후)

---

## 참고

- 검증 원칙: `docs/dev-process.md` 섹션 5
- 배포 이력: `docs/deploy-history/`
- 롤백 방법: `docs/dev-process.md` 섹션 6.4
