# 배포 후 수동 작업 가이드

> **목적**: 현재 완료되지 않은 수동 검증/작업 항목만 유지합니다.
> 완료된 기록은 `docs/deploy-history/YYYY-MM-DD.md`로 이동됩니다.

---

## 현재 미완료 항목

### Sprint 4 — 결과 화면 UI, MVP 완성 (2026-03-15)

포함 스프린트: Sprint 4 (결과 화면 UI 구현)

**자동 검증** — Docker 미실행, 로컬 프로세스로 검증 수행

- ✅ `pytest backend/tests/` 5개 통과
- ✅ `/health` 엔드포인트 HTTP 200 확인
- ✅ `/analyze` 엔드포인트 존재 확인 (POST 전용)
- ✅ 프론트엔드 `/upload` 라우트 HTTP 200 확인
- ✅ 프론트엔드 `/result` 라우트 HTTP 200 확인
- ⬜ Docker 미실행으로 `docker compose exec backend pytest` 미수행

**수동 검증 필요**

- ⬜ `docker compose up --build` 프론트엔드 + 백엔드 통합 기동 확인
- ⬜ 브라우저에서 이미지 업로드 → 분석 완료 → `/result` 화면 전환 E2E 확인
- ⬜ 유추 병명 태그 표시 확인 (matched 약품 있을 때)
- ⬜ matched 약품 카드 파란 테두리, unmatched 약품 카드 회색 흐림 확인
- ⬜ 경고 섹션 표시 확인 (warnings 있을 때)
- ⬜ "다시 분석하기" 버튼 → `/upload` 복귀 확인
- ⬜ `/result` 직접 접근 시 `/upload` 리다이렉트 확인
- ⬜ UI 디자인 시각적 품질 확인 (모바일 375px 포함)

**이전 스프린트 미완료 항목 (계속 유지)**

- ⬜ Tesseract 설치 후 처방전 샘플 이미지로 OCR + 약품명 매칭 확인:
  ```bash
  # Tesseract 설치 (macOS)
  brew install tesseract tesseract-lang
  # 이미지 업로드 테스트
  curl -X POST http://localhost:8000/analyze -F "file=@/path/to/prescription.jpg"
  ```
- ⬜ `docs/dev-process.md` 섹션 6.3 SSH 접속 정보 설정 후 실서버 검증 수행
  - ⬜ `/api/v1/health` 헬스체크 HTTP 200 확인
  - ⬜ 컨테이너 상태 확인 (`docker compose -f docker-compose.prod.yml ps`)
  - ⬜ 백엔드 로그 오류 없음 확인
  - ⬜ 프론트엔드 메인 페이지 로딩 확인

---

## 참고

- 검증 원칙: `docs/dev-process.md` 섹션 5
- 배포 이력: `docs/deploy-history/`
- 롤백 방법: `docs/dev-process.md` 섹션 6.4
