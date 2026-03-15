# Sprint Planner 메모리

이 파일은 sprint-planner 에이전트의 영구 메모리입니다.
프로젝트 진행 상황, 기술 스택, 패턴 등을 기록합니다.

---

## 스프린트 현황

| 스프린트 | 목표 | 상태 | 완료일 | 브랜치 |
|----------|------|------|--------|--------|
| Sprint 1 | 사용자 동의 UI, Next.js 프로젝트 초기화 | ✅ 완료 | 2026-03-15 | sprint1 |
| Sprint 2 | 이미지 입력 방식 선택, 미리보기, 분석 시작 버튼 | ✅ 완료 | 2026-03-15 | sprint2 |
| Sprint 3 | OCR/이미지 인식 백엔드 모듈 | ✅ 완료 | 2026-03-15 | sprint3 |
| Sprint 4 | 프론트-백엔드 연동, 결과 화면 UI | ✅ 완료 | 2026-03-15 | sprint4 |
| Sprint 5 | 이미지 기반 알약 낱알식별 파이프라인 | ✅ 완료 | 2026-03-15 | sprint5 |

**다음 사용 가능한 스프린트 번호: Sprint 6**

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
│   └── upload/   # Sprint 2: 이미지 업로드 라우트
├── components/   # 공유 컴포넌트
├── lib/          # API 클라이언트 등 유틸 (analyzeImage stub — Sprint 3 교체 예정)
└── public/       # 정적 에셋

docker/
├── frontend/Dockerfile.prod
└── backend/Dockerfile.prod  # Sprint 3에서 구현 예정
```

---

## 디렉토리 구조 (Sprint 4 이후)

```
frontend/
├── app/
│   ├── upload/   # Sprint 2: 이미지 업로드 라우트
│   └── result/   # Sprint 4: 분석 결과 라우트
├── components/
│   ├── UploadPage.tsx   # 이미지 업로드 UI
│   └── ResultPage.tsx   # 분석 결과 UI (Sprint 4 신규)
├── lib/
│   ├── api.ts           # 백엔드 API 클라이언트 (analyzeImage)
│   └── inferDiseases.ts # usage 키워드 → 질환 카테고리 유틸 (Sprint 4 신규)
└── public/
```

---

## 핵심 주의사항

- `develop` 브랜치가 원격에 없었으므로 Sprint 1 마무리 시 master 기준으로 신규 생성함 (2026-03-15)
- Sprint 2에서 `/upload` 라우트 구현 시 `frontend/app/upload/page.tsx` 경로 사용
- `docker-compose.yml`의 backend 서비스는 주석 처리 상태 — Sprint 3에서 활성화
- CI yml(`ci.yml`)의 Docker 빌드 경로: `docker/frontend/Dockerfile.prod` (고정)
- Dockerfile.prod의 `deps` 스테이지(`--only=production`)와 `builder` 스테이지(`npm ci`) 이중 설치 구조는 레이어 캐시 최적화 여지 있음 (개선 필요 시 builder 스테이지 단일화 고려)
- 루트 `.gitignore`에 Python용 `lib/` 패턴이 등록되어 있어 `frontend/lib/`가 무시됨 — Sprint 2에서 `!frontend/lib/` 예외 처리 추가 (2026-03-15)
- `frontend/lib/api.ts`의 `analyzeImage`는 현재 2초 stub — Sprint 3에서 실제 OCR API 엔드포인트로 교체 필요
- `AnalysisResult.data: unknown`으로 선언 — Sprint 3에서 `AnalysisData` 타입으로 구체화 완료
- Sprint 4에서 `/result` 라우트 구현: App Router `app/result/page.tsx` (Shell) + `components/ResultPage.tsx` (실제 UI) 패턴 사용
- 분석 결과는 sessionStorage(`analysisResult` 키)로 업로드 페이지 → 결과 페이지 간 전달
- `inferDiseases.ts`의 `KEYWORD_MAP`은 현재 43개 키워드 — 약품 데이터 확장 시 함께 확장 필요
- MVP Phase 1 전체 완료 (Sprint 1~4): 동의 UI → 업로드 → OCR 분석 → 결과 화면 흐름 구현 완료
- Sprint 5에서 `pill_identifier.py` 신규 추가: `identify_pills(image_bytes)` → `List[PillFeatures]` 반환
- `drug_api.py`의 `_pill_cache`는 dict 기반 무한 성장 캐시 — Sprint 6 이후 크기 제한 개선 고려
- `_map_hsv_to_color_name()`은 식약처 낱알식별 API 색상명과 매핑됨 (하양/빨강/주황/노랑/초록/청록/파랑/남색/보라/분홍/회색/검정)
