# 배포 후 수동 작업 가이드

> **목적**: 현재 완료되지 않은 수동 검증/작업 항목만 유지합니다.
> 완료된 기록은 `docs/deploy-history/YYYY-MM-DD.md`로 이동됩니다.

---

## 현재 미완료 항목

### Sprint 7 — 핵심 모듈 단위 테스트 (2026-03-16)

- ✅ `pytest backend/tests/ -v` 전체 40개 통과
- ✅ 외부 API 실제 호출 없음 (unittest.mock 완전 격리)
- ⬜ Docker 빌드 후 통합 기동 확인 (`docker compose up --build`)

---

## 참고

- 검증 원칙: `docs/dev-process.md` 섹션 5
- 배포 이력: `docs/deploy-history/`
- 롤백 방법: `docs/dev-process.md` 섹션 6.4
