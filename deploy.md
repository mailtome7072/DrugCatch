# 배포 후 수동 작업 가이드

> **목적**: 현재 완료되지 않은 수동 검증/작업 항목만 유지합니다.
> 완료된 기록은 `docs/deploy-history/YYYY-MM-DD.md`로 이동됩니다.

---

## 현재 미완료 항목

### 프로덕션 배포 — v0.6.0 (2026-03-15)

포함 스프린트: Sprint 5 (알약 낱알식별 파이프라인), Sprint 6 (Claude Vision API 연동)

**서버 환경변수 확인 (신규)**

- ⬜ `ANTHROPIC_API_KEY` 서버 환경변수 설정 확인 (Sprint 6 신규)
- ⬜ `DRUG_API_KEY` 서버 환경변수 설정 확인 (Sprint 5 신규)

**실서버 자동 검증** — SSH 접속 정보 설정 후 수행 (`docs/dev-process.md` 섹션 6.3 참조)

- ⬜ `/api/v1/health` 헬스체크 확인
- ⬜ 컨테이너 상태 확인 (docker compose ps)
- ⬜ 백엔드 로그 오류 확인
- ⬜ 프론트엔드 메인 페이지 로딩 확인 (Playwright)

**수동 기능 검증**

- ⬜ `docker compose up --build` 프론트엔드 + 백엔드 통합 기동 확인
- ⬜ 알약 이미지 업로드 후 Vision API 결과 카드 표시 확인 (`ANTHROPIC_API_KEY` 설정 후)
- ⬜ `ANTHROPIC_API_KEY` 미설정 환경에서 graceful fallback 동작 확인
- ⬜ packaged_drug 이미지 업로드 후 낱알식별 API 조회 결과 카드 표시 확인
- ⬜ OCR 결과와 낱알식별 결과 중복 없이 병합 확인
- ⬜ UI 디자인 시각적 품질 확인 (모바일 375px 포함)

---

## 참고

- 검증 원칙: `docs/dev-process.md` 섹션 5
- 배포 이력: `docs/deploy-history/`
- 롤백 방법: `docs/dev-process.md` 섹션 6.4
