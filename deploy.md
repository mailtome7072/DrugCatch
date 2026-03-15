# 배포 후 수동 작업 가이드

> **목적**: 현재 완료되지 않은 수동 검증/작업 항목만 유지합니다.
> 완료된 기록은 `docs/deploy-history/YYYY-MM-DD.md`로 이동됩니다.

---

## 현재 미완료 항목

### Sprint 5 — 알약 낱알식별 파이프라인 (2026-03-15)

- ⬜ `docker compose up --build` 프론트엔드 + 백엔드 통합 기동 확인
- ⬜ packaged_drug 이미지 업로드 후 낱알식별 API 조회 결과 카드 표시 확인
- ⬜ OCR 결과와 낱알식별 결과 중복 없이 병합 확인
- ⬜ UI 디자인 시각적 품질 확인 (모바일 375px 포함)

---

## 참고

- 검증 원칙: `docs/dev-process.md` 섹션 5
- 배포 이력: `docs/deploy-history/`
- 롤백 방법: `docs/dev-process.md` 섹션 6.4
