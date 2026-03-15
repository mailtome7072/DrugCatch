# Sprint 2 계획 — 이미지 업로드 UI

| 항목 | 내용 |
|------|------|
| 스프린트 번호 | Sprint 2 |
| 기간 | 2026-03-15 (Day 1) |
| 브랜치 | `sprint2` |
| 담당 영역 | Frontend 전용 |
| 목표 마일스톤 | Phase 1 MVP 이미지 입력 화면 완성 |

---

## 1. 스프린트 목표

Sprint 1에서 구현한 동의 페이지의 "분석 시작" 버튼이 라우팅하는 `/upload` 경로를 구현합니다.
사용자가 처방전 또는 약품 사진을 촬영하거나 갤러리에서 업로드하고, 미리보기를 확인한 뒤 분석을 요청할 수 있는 이미지 입력 화면을 완성합니다.
Sprint 3의 백엔드 OCR API 연동에 대비하여 API 호출 인터페이스를 설계합니다.

---

## 2. 구현 범위

### 포함 항목

- `/upload` 라우트 생성 (`frontend/app/upload/page.tsx` 서버 컴포넌트)
- 이미지 업로드 클라이언트 컴포넌트 (`frontend/components/UploadPage.tsx`)
  - 입력 방식 선택 UI: "카메라 촬영" / "파일 선택" 탭 버튼
  - 카메라 촬영: `navigator.mediaDevices.getUserMedia`로 라이브 뷰파인더 표시 후 "촬영" 버튼으로 캡처 (`canvas` → `File` 변환). 카메라 탭 클릭 시 즉시 카메라 실행
  - 파일 선택: `<input type="file" accept="image/*">` (visually hidden, 버튼 클릭으로 트리거)
  - 이미지 미리보기: 선택한 파일을 `URL.createObjectURL()`로 표시
  - 이미지 재선택/교체: "다시 선택" + "이미지 분석 시작" 버튼을 한 줄로 배치 (좌: 다시 선택, 우: 분석 시작)
  - "이미지 분석 시작" 버튼: 이미지 선택 전 비활성화, 선택 후 활성화
  - 로딩 인디케이터: 분석 요청 중 버튼 내 스피너 + 텍스트 "분석 중..." 표시
  - 에러 처리: 지원하지 않는 파일 형식, 파일 크기 초과(10MB) 안내, 카메라 권한 거부 안내
  - 안내 문구: 이미지 선택 영역/카메라 뷰파인더/버튼 아래에 저장 안내 및 분석 대상 이미지 설명 표시
  - 콘솔 로깅: 파일 선택, 분석 시작, 에러 발생 시점 로그
- Sprint 3 연동 인터페이스: `analyzeImage(file: File): Promise<AnalysisResult>` 함수 stub

### 제외 항목

- 백엔드 OCR API 실제 연동 (Sprint 3)
- 분석 결과 화면 표시 (Sprint 4)
- 다중 이미지 업로드 (현재 MVP 범위 밖)
- 인증/로그인 기능 (현재 MVP 범위 밖)

---

## 3. 기술적 결정사항

### 컴포넌트 설계

| 파일 | 역할 | 컴포넌트 종류 |
|------|------|--------------|
| `app/upload/page.tsx` | `/upload` 라우트 진입점, 메타데이터 설정 | 서버 컴포넌트 |
| `components/UploadPage.tsx` | 이미지 입력 전체 상태 관리 | 클라이언트 컴포넌트 (`'use client'`) |

### 상태 관리

```typescript
// UploadPage.tsx 내부 상태
type InputMode = 'camera' | 'file';

const [inputMode, setInputMode] = useState<InputMode>('file');
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);

// 카메라 관련 상태
const [isCameraOpen, setIsCameraOpen] = useState(false);
const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
```

### 파일 유효성 검사 규칙

| 항목 | 규칙 |
|------|------|
| 허용 파일 형식 | `image/jpeg`, `image/png`, `image/webp`, `image/heic` |
| 최대 파일 크기 | 10MB |
| 최소 파일 크기 | 제한 없음 |

### Sprint 3 연동 인터페이스 (stub)

```typescript
// lib/api.ts (신규 생성)
export interface AnalysisResult {
  // Sprint 3에서 백엔드 응답 스펙 확정 후 채워질 예정
  status: 'success' | 'error';
  data?: unknown;
  message?: string;
}

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  // Sprint 3에서 실제 API 엔드포인트로 교체 예정
  // 현재는 stub: 2초 지연 후 성공 반환 (UI 테스트용)
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('[DrugCatch] 분석 요청 (stub):', file.name, file.size);
  return { status: 'success' };
}
```

### 디렉토리 구조 변경

```
frontend/
├── app/
│   ├── layout.tsx          # 기존 (변경 없음)
│   ├── page.tsx            # 기존 (변경 없음)
│   ├── globals.css         # 기존 (변경 없음)
│   └── upload/             # 신규
│       └── page.tsx        # /upload 서버 컴포넌트
├── components/
│   ├── ConsentPage.tsx     # 기존 (변경 없음)
│   └── UploadPage.tsx      # 신규 — 이미지 업로드 클라이언트 컴포넌트
└── lib/                    # 신규
    └── api.ts              # analyzeImage stub (Sprint 3에서 실구현)
```

---

## 4. 태스크 목록

### T1. `/upload` 라우트 서버 컴포넌트 생성

- **우선순위**: P0 (블로커 — 다른 태스크의 진입점)
- **예상 소요**: 10분
- 세부 작업:
  - `frontend/app/upload/` 디렉토리 생성
  - `frontend/app/upload/page.tsx` 서버 컴포넌트 작성
    - `export const metadata` 로 페이지 타이틀 "이미지 업로드 | DrugCatch" 설정
    - `<UploadPage />` 클라이언트 컴포넌트 임포트 및 렌더링

### T2. `UploadPage.tsx` 클라이언트 컴포넌트 — 입력 방식 선택 UI

- **우선순위**: P0 (핵심 기능)
- **예상 소요**: 30분
- 세부 작업:
  - `'use client'` 선언, `useState` 훅으로 `inputMode` 상태 관리
  - 탭 버튼 UI: "카메라 촬영" / "파일 선택" 버튼 (활성 탭 강조 스타일)
  - `inputMode === 'camera'`일 때: `<input ... capture="environment">` 렌더링
  - `inputMode === 'file'`일 때: `<input ... >` (capture 속성 없음) 렌더링
  - `<input>` 요소는 visually hidden 처리, 스타일드 버튼으로 클릭 트리거
  - `useRef`로 input 요소 참조 후 `ref.current.click()` 호출 방식 사용

### T3. `UploadPage.tsx` — 이미지 미리보기 및 재선택

- **우선순위**: P0 (핵심 기능)
- **예상 소요**: 25분
- 세부 작업:
  - `onChange` 핸들러에서 `URL.createObjectURL(file)` 로 `previewUrl` 생성
  - 파일 유효성 검사 (형식, 크기) 후 오류 시 `errorMessage` 설정, 미리보기 생략
  - `previewUrl`이 있으면 `<img>` 태그로 미리보기 표시 (max-h-64, object-contain)
  - "다시 선택" 버튼: `setSelectedFile(null)`, `setPreviewUrl(null)`, input value 초기화
  - 컴포넌트 언마운트 시 `URL.revokeObjectURL(previewUrl)` 정리 (`useEffect` 반환)

### T4. `UploadPage.tsx` — 분석 시작 버튼 및 로딩 인디케이터

- **우선순위**: P0 (핵심 기능)
- **예상 소요**: 20분
- 세부 작업:
  - "이미지 분석 시작" 버튼: `selectedFile`이 없으면 `disabled`
  - 버튼 클릭 시 `setIsAnalyzing(true)` → `analyzeImage(selectedFile)` 호출
  - `isAnalyzing === true`일 때: 버튼 내 인라인 SVG 스피너 + "분석 중..." 텍스트 표시
  - `isAnalyzing === true`일 때: 입력 방식 탭, 파일 input, "다시 선택" 버튼 모두 비활성화
  - 분석 완료(stub) 후: `setIsAnalyzing(false)`, 콘솔 로그 출력 (Sprint 4에서 결과 화면 연결)
  - 에러 발생 시: `setErrorMessage(...)`, `setIsAnalyzing(false)`

### T5. `lib/api.ts` — analyzeImage stub 작성

- **우선순위**: P1 (Sprint 3 연동 준비)
- **예상 소요**: 15분
- 세부 작업:
  - `frontend/lib/` 디렉토리 생성
  - `frontend/lib/api.ts` 작성: `AnalysisResult` 타입, `analyzeImage` 함수 stub
  - stub 구현: 2초 지연 후 `{ status: 'success' }` 반환
  - 에러 케이스 처리: try-catch로 감싸고 `{ status: 'error', message: ... }` 반환

### T6. 에러 처리 및 콘솔 로깅

- **우선순위**: P1
- **예상 소요**: 15분
- 세부 작업:
  - 파일 형식 오류 메시지: "JPG, PNG, WebP, HEIC 형식의 이미지만 업로드할 수 있습니다."
  - 파일 크기 오류 메시지: "파일 크기가 10MB를 초과합니다."
  - 에러 메시지 UI: 빨간색 안내 텍스트, 미리보기 영역 위에 표시
  - 콘솔 로그 포인트:
    - 파일 선택 성공: `[DrugCatch] 파일 선택: {name}, {size}bytes`
    - 파일 유효성 실패: `[DrugCatch] 파일 유효성 오류: {reason}`
    - 분석 시작: `[DrugCatch] 분석 시작: {name}`
    - 분석 완료: `[DrugCatch] 분석 완료`
    - 분석 실패: `[DrugCatch] 분석 오류: {error}`

### T7. ESLint / TypeScript 오류 해소 및 빌드 검증

- **우선순위**: P1 (CI 통과 필수)
- **예상 소요**: 10분
- 세부 작업:
  - `npm run lint` 통과 확인 (`frontend/` 디렉토리에서)
  - `npm run build` 로컬 빌드 성공 확인
  - TypeScript `any` 타입 미사용 확인 (`unknown` 또는 구체 타입으로 대체)
  - `AnalysisResult.data` 타입은 `unknown`으로 선언 (Sprint 3에서 확정)

---

## 5. 의존성 및 리스크

| 리스크 | 가능성 | 대응 방안 |
|--------|--------|----------|
| `getUserMedia` 카메라 권한 거부 | 중 | 권한 거부 시 에러 메시지 표시, 파일 선택 탭으로 전환 유도 |
| `getUserMedia` 미지원 브라우저 | 저 | 에러 캐치 후 안내 메시지 표시 |
| `URL.createObjectURL` 메모리 누수 | 중 | `useEffect` cleanup에서 `URL.revokeObjectURL` 호출로 해소 |
| HEIC 파일 형식 브라우저 미지원 | 중 | accept 속성에 HEIC 포함하되, 미리보기 실패 시 "지원하지 않는 형식" 오류 메시지 표시 |
| Sprint 3 API 응답 스펙 미확정 | 고 | `AnalysisResult.data: unknown` 으로 선언, Sprint 3에서 타입 확정 후 교체 |
| 10MB 초과 이미지 처리 시간 | 저 | 클라이언트 사이드에서 크기 검사 후 즉시 거부, API 호출 방지 |

---

## 6. 완료 기준 (Definition of Done)

### 기능 완료 기준

- ✅ 동의 페이지에서 "분석 시작" 클릭 시 `/upload` 경로로 이동한다
- ✅ "카메라 촬영" 탭 클릭 시 즉시 카메라 권한 요청 및 라이브 뷰파인더가 표시된다
- ✅ 뷰파인더에서 "촬영" 버튼 클릭 시 현재 프레임이 캡처되어 미리보기로 전환된다
- ✅ "취소" 버튼 클릭 시 카메라 스트림이 종료된다
- ✅ 카메라 권한 거부 시 에러 메시지가 표시된다
- ✅ "파일 선택" 탭 선택 후 클릭 시 파일 선택창이 열린다
- ✅ 이미지 선택 후 미리보기가 화면에 표시된다
- ✅ "다시 선택"(좌)과 "이미지 분석 시작"(우) 버튼이 한 줄로 나란히 표시된다
- ✅ "다시 선택" 버튼 클릭 시 미리보기가 초기화되고 재선택이 가능하다
- ✅ 이미지 미선택 상태에서 "이미지 분석 시작" 버튼이 비활성화된다
- ✅ 이미지 선택 후 "이미지 분석 시작" 버튼이 활성화된다
- ✅ "이미지 분석 시작" 클릭 시 로딩 스피너와 "분석 중..." 텍스트가 표시된다
- ✅ 지원하지 않는 파일 형식 선택 시 에러 메시지가 표시된다
- ✅ 10MB 초과 파일 선택 시 에러 메시지가 표시된다
- ✅ 이미지 영역/뷰파인더/버튼 아래 저장 안내 및 분석 대상 이미지 안내 문구가 표시된다
- ✅ 모바일 화면(375px)에서 레이아웃이 깨지지 않는다

### 기술 완료 기준

- ✅ `npm run build` 로컬 빌드 성공
- ✅ `npm run lint` ESLint 오류 없음
- ✅ TypeScript `any` 타입 미사용
- ✅ `lib/api.ts`의 `analyzeImage` 함수 stub 존재 (Sprint 3 교체 준비)
- ⬜ `docker build -f docker/frontend/Dockerfile.prod --target runtime -t app-frontend:test .` 성공

### 문서 완료 기준

- ✅ `docs/sprint/sprint2.md` 계획 문서 존재
- ⬜ ROADMAP.md의 Sprint 2 상태가 진행 중으로 표시됨

---

## 7. 검증 방법

### 로컬 수동 검증

```bash
# 1. Next.js 개발 서버 기동
cd frontend && npm run dev
# → http://localhost:3000 접속, 동의 체크 후 "분석 시작" 클릭 → /upload 이동 확인

# 2. 프로덕션 빌드 확인
cd frontend && npm run build

# 3. ESLint 확인
cd frontend && npm run lint

# 4. Docker 빌드 확인 (프로젝트 루트에서)
docker build -f docker/frontend/Dockerfile.prod --target runtime -t app-frontend:test .
```

### 체크리스트 (UI 시각 검증)

- ⬜ `/upload` 경로 접속 시 업로드 페이지 렌더링 확인
- ⬜ "카메라 촬영" / "파일 선택" 탭 버튼 표시 확인
- ⬜ 탭 전환 시 버튼 강조 스타일 변경 확인
- ⬜ 파일 선택 후 미리보기 이미지 표시 확인
- ⬜ "다시 선택" 버튼으로 미리보기 초기화 확인
- ⬜ 이미지 없을 때 "이미지 분석 시작" 버튼 비활성화 확인
- ⬜ 이미지 있을 때 버튼 활성화 확인
- ⬜ 버튼 클릭 시 2초간 로딩 스피너 표시 확인
- ⬜ 잘못된 파일 형식 선택 시 에러 메시지 표시 확인

---

## 8. 예상 산출물

| 파일 | 설명 |
|------|------|
| `frontend/app/upload/page.tsx` | `/upload` 라우트 서버 컴포넌트 |
| `frontend/components/UploadPage.tsx` | 이미지 업로드 클라이언트 컴포넌트 |
| `frontend/lib/api.ts` | `analyzeImage` stub 및 `AnalysisResult` 타입 |
| `docs/sprint/sprint2.md` | 본 계획 문서 |

---

## 9. 다음 스프린트 연계

Sprint 2 완료 후 Sprint 3에서 다음을 이어받습니다:

- `lib/api.ts`의 `analyzeImage` stub을 실제 백엔드 OCR API 엔드포인트로 교체
- `AnalysisResult` 타입을 백엔드 응답 스펙에 맞게 구체화
- 분석 완료 후 결과 페이지(`/result`)로 라우팅 연결 (Sprint 4)
- 백엔드 Python OCR 모듈 구현 (Tesseract OCR, OpenCV)
