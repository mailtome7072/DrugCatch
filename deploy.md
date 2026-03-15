# 배포 후 수동 작업 가이드

> **목적**: 현재 완료되지 않은 수동 검증/작업 항목만 유지합니다.
> 완료된 기록은 `docs/deploy-history/YYYY-MM-DD.md`로 이동됩니다.

---

## 현재 미완료 항목

### Sprint 3 — FastAPI 백엔드 OCR API (2026-03-15)

**자동 검증 완료**

- ✅ `pytest backend/tests/` 통과 (4 passed, 1 skipped — Tesseract 조건부 스킵)
- ✅ `/health` 엔드포인트 HTTP 200 응답 확인
- ✅ 비이미지 파일 업로드 시 HTTP 422 에러 응답 확인

**수동 검증 필요**

- ⬜ Tesseract 설치 후 처방전 샘플 이미지로 OCR + 약품명 매칭 확인:
  ```bash
  # Tesseract 설치 (macOS)
  brew install tesseract tesseract-lang
  # 이미지 업로드 테스트
  curl -X POST http://localhost:8000/analyze -F "file=@/path/to/prescription.jpg"
  ```
- ⬜ 프론트엔드 업로드 페이지에서 실 API 연동 확인 (브라우저 콘솔 로그)
  - ⬜ "이미지 분석 시작" 버튼 클릭 시 실제 백엔드 API 호출 확인
  - ⬜ 네트워크 탭에서 `POST /analyze` 요청 확인
  - ⬜ 응답 결과 콘솔 출력 확인
- ⬜ `npm run lint` ESLint 오류 없음 확인
- ⬜ `npm run build` 프론트엔드 빌드 성공 확인
- ⬜ Docker 백엔드 빌드 확인:
  ```bash
  docker build -f docker/backend/Dockerfile.prod --target runtime -t app-backend:test .
  ```
- ⬜ `docker compose up --build` 프론트엔드 + 백엔드 통합 기동 확인

---

## 참고

- 검증 원칙: `docs/dev-process.md` 섹션 5
- 배포 이력: `docs/deploy-history/`
- 롤백 방법: `docs/dev-process.md` 섹션 6.4
