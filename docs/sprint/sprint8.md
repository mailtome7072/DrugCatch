# Sprint 8 — 프론트엔드 테스트 도입 (단위/E2E/성능)

## 개요

| 항목 | 내용 |
|------|------|
| 스프린트 번호 | Sprint 8 |
| 브랜치 | `sprint8` |
| 기간 | 2일 |
| 작업 디렉토리 | `frontend/` |
| 선행 스프린트 | Sprint 7 (백엔드 단위 테스트 40개 완료) |

---

## 배경 및 목적

Sprint 7에서 백엔드 핵심 모듈의 단위 테스트 40개가 완비되었다.
그러나 프론트엔드(`frontend/`)에는 테스트가 전무하다.

핵심 비즈니스 로직인 `inferDiseases()`, API 호출 함수 `analyzeImage()`, 그리고
주요 UI 컴포넌트(`UploadPage`, `ResultPage`)는 릴리즈 신뢰도에 직접 영향을 미친다.
이번 스프린트에서는 다음 세 계층의 테스트를 도입한다.

1. **단위/컴포넌트 테스트** — 순수 로직과 React 컴포넌트 동작을 Jest + React Testing Library로 검증
2. **E2E 통합 테스트** — 주요 사용자 시나리오를 Playwright로 자동화
3. **성능 테스트** — Lighthouse CI를 GitHub Actions에 통합하여 핵심 Web Vitals 기준선 확보

1인 프로젝트 특성상 "과도한 커버리지"보다 **회귀를 조기 발견할 수 있는 핵심 테스트**에 집중한다.

---

## 스프린트 목표

- `inferDiseases()` 순수 함수 및 `analyzeImage()` API 함수에 대한 단위 테스트 작성
- `UploadPage`, `ResultPage` 컴포넌트의 핵심 상호작용 시나리오를 RTL로 검증
- Playwright로 업로드 → 분석 → 결과 확인 핵심 E2E 플로우 자동화
- Lighthouse CI GitHub Actions 연동으로 LCP ≤ 2.5s, CLS ≤ 0.1 기준선 확보

---

## 구현 범위

### 포함

- Jest + React Testing Library 설정 (`jest.config.ts`, `jest.setup.ts`)
- 단위 테스트: `frontend/__tests__/lib/inferDiseases.test.ts`
- 단위 테스트: `frontend/__tests__/lib/api.test.ts`
- 컴포넌트 테스트: `frontend/__tests__/components/UploadPage.test.tsx`
- 컴포넌트 테스트: `frontend/__tests__/components/ResultPage.test.tsx`
- Playwright 설정 (`playwright.config.ts`)
- E2E 테스트: `frontend/e2e/upload-flow.spec.ts`
- E2E 테스트: `frontend/e2e/result-page.spec.ts`
- Lighthouse CI 설정 (`.github/workflows/lighthouse.yml`, `lighthouserc.json`)
- `package.json` 테스트 스크립트 추가 (`test`, `test:e2e`, `test:coverage`)

### 제외

- 100% 커버리지 달성 (목표 아님)
- 카메라(`getUserMedia`) 관련 테스트 — 브라우저 API mock 복잡도 대비 가치 낮음
- 백엔드 단위 테스트 수정
- Storybook 또는 시각적 회귀 테스트 도구

---

## 작업 분해 (Task Breakdown)

### Task 1 — Jest + RTL 환경 설정 (1h)

**목적**: Next.js 16 + React 19 환경에서 Jest가 동작하도록 설정

**설치 패키지**:
```
jest jest-environment-jsdom @jest/globals
@testing-library/react @testing-library/user-event @testing-library/jest-dom
ts-jest @types/jest
```

**생성 파일**:

`jest.config.ts`
```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
  ],
};

export default createJestConfig(config);
```

`jest.setup.ts`
```typescript
import '@testing-library/jest-dom';
```

**`package.json` 스크립트 추가**:
```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

**완료 기준**: `npm test` 실행 시 에러 없이 종료

---

### Task 2 — `inferDiseases` 단위 테스트 (1h)

**대상**: `frontend/lib/inferDiseases.ts`의 `inferDiseases()` 함수

**파일**: `frontend/__tests__/lib/inferDiseases.test.ts`

| # | 테스트 케이스 | 입력 | 기대 출력 |
|---|-------------|------|-----------|
| T2-1 | 빈 배열 | `[]` | `[]` |
| T2-2 | matched=false 약품만 있을 때 | matched=false 약품 3개 | `[]` |
| T2-3 | 단일 키워드 매핑 | usage: "해열 진통" matched=true | `["발열", "통증"]` |
| T2-4 | 중복 카테고리 제거 | 동일 카테고리 키워드 복수 약품 | 중복 없는 배열 |
| T2-5 | 최대 5개 제한 | usage에 6개 이상 매핑되는 약품 | 길이 ≤ 5 |
| T2-6 | usage 없는 약품 | `usage: ""` matched=true | `[]` |
| T2-7 | KEYWORD_MAP 키 정합성 | `KEYWORD_MAP` 각 key | 문자열 key, value 모두 string |

**구현 전략**: 순수 함수이므로 mock 불필요. `DrugInfo` 객체를 직접 생성하여 입력.

---

### Task 3 — `analyzeImage` API 함수 단위 테스트 (1h)

**대상**: `frontend/lib/api.ts`의 `analyzeImage()`

**파일**: `frontend/__tests__/lib/api.test.ts`

| # | 테스트 케이스 | mock 대상 | 검증 포인트 |
|---|-------------|-----------|-------------|
| T3-1 | 정상 응답 (status: success) | `global.fetch` | `AnalysisResult` 반환 |
| T3-2 | HTTP 4xx 에러 | `global.fetch` | `{ status: 'error', message: ... }` 반환 |
| T3-3 | HTTP 5xx 에러 | `global.fetch` | `{ status: 'error', message: ... }` 반환 |
| T3-4 | 네트워크 에러 (fetch 예외) | `global.fetch` | 예외 전파 (throw) |
| T3-5 | FormData에 file 필드 포함 여부 | `global.fetch` mock 캡처 | `formData.get('file')` 일치 |

**구현 전략**:
```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ status: 'success', data: mockData }),
});
```
각 테스트 후 `jest.clearAllMocks()` 호출.

---

### Task 4 — `UploadPage` 컴포넌트 테스트 (1.5h)

**대상**: `frontend/components/UploadPage.tsx`

**파일**: `frontend/__tests__/components/UploadPage.test.tsx`

| # | 테스트 케이스 | 검증 포인트 |
|---|-------------|-------------|
| T4-1 | 초기 렌더링 | "파일 선택" 탭 활성, 업로드 영역 표시 |
| T4-2 | 유효한 이미지 파일 선택 | 미리보기 이미지 표시, "이미지 분석 시작" 버튼 활성화 |
| T4-3 | 허용되지 않는 파일 형식 | 에러 메시지 표시 (`role="alert"`) |
| T4-4 | 10MB 초과 파일 | 에러 메시지 표시 |
| T4-5 | "다시 선택" 버튼 클릭 | 미리보기 초기화, 버튼 비활성화 |
| T4-6 | 분석 중 로딩 상태 | "분석 중..." 표시, 버튼 비활성화 |
| T4-7 | 분석 성공 → 결과 페이지 라우팅 | `router.push('/result')` 호출, sessionStorage 저장 |
| T4-8 | 분석 실패 (error status) | 에러 메시지 표시 |

**mock 대상**:
- `@/lib/api`의 `analyzeImage` → `jest.mock`
- `next/navigation`의 `useRouter` → `jest.mock`
- `sessionStorage` → jsdom 기본 제공

**주의사항**: `URL.createObjectURL`, `URL.revokeObjectURL`은 jsdom 미지원이므로
`jest.setup.ts`에서 mock 추가:
```typescript
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();
```

---

### Task 5 — `ResultPage` 컴포넌트 테스트 (1h)

**대상**: `frontend/components/ResultPage.tsx`

**파일**: `frontend/__tests__/components/ResultPage.test.tsx`

| # | 테스트 케이스 | 검증 포인트 |
|---|-------------|-------------|
| T5-1 | sessionStorage 데이터 없을 때 | `router.replace('/upload')` 호출 |
| T5-2 | 정상 데이터 렌더링 (처방전) | "처방전" 배지, 약품 카드 렌더링 |
| T5-3 | matched=true 약품만 카드 표시 | matched=false 약품 카드 미표시 |
| T5-4 | 병명 유추 표시 | `inferDiseases` 결과 태그 렌더링 |
| T5-5 | 약품 카드 없을 때 빈 상태 메시지 | "약품 정보를 추출하지 못했습니다" 표시 |
| T5-6 | "다시 분석하기" 버튼 클릭 | sessionStorage 삭제 후 `router.push('/upload')` |

**mock 대상**:
- `next/navigation`의 `useRouter` → `jest.mock`
- `sessionStorage.getItem` → 각 테스트별 `jest.spyOn`으로 데이터 주입

**fixture 헬퍼**:
```typescript
function makeAnalysisResult(overrides?: Partial<AnalysisData>): AnalysisResult {
  return {
    status: 'success',
    data: {
      image_type: 'prescription',
      extracted_text: '타이레놀',
      drugs: [{ drug_name: '타이레놀', matched: true, usage: '해열 진통', ... }],
      warnings: [],
      ...overrides,
    },
  };
}
```

---

### Task 6 — Playwright E2E 설정 및 테스트 작성 (2h)

#### 6-A. Playwright 설치 및 설정 (0.5h)

**설치**:
```bash
npm init playwright@latest --yes -- --quiet --browser=chromium --no-examples
```

**`playwright.config.ts` 핵심 설정**:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**`package.json` 스크립트 추가**:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

#### 6-B. 업로드 플로우 E2E 테스트 (0.75h)

**파일**: `frontend/e2e/upload-flow.spec.ts`

| # | 시나리오 | 검증 포인트 |
|---|---------|-------------|
| E2E-1 | 페이지 접근 및 탭 표시 | "파일 선택", "카메라 촬영" 탭 표시 |
| E2E-2 | 파일 업로드 → 미리보기 표시 | 이미지 미리보기, 분석 버튼 활성화 |
| E2E-3 | 잘못된 파일 형식 (txt) | 에러 메시지 표시 |
| E2E-4 | 분석 API mock → 성공 후 결과 페이지 이동 | URL `/result` 도달 |

**API mock 전략**: Playwright `page.route()`로 백엔드 없이 테스트:
```typescript
await page.route('**/analyze', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockSuccessResponse),
  });
});
```

#### 6-C. 결과 페이지 E2E 테스트 (0.75h)

**파일**: `frontend/e2e/result-page.spec.ts`

| # | 시나리오 | 검증 포인트 |
|---|---------|-------------|
| E2E-5 | sessionStorage 없이 직접 접근 | `/upload`로 리다이렉트 |
| E2E-6 | 정상 결과 데이터 → 결과 화면 렌더링 | 약품 카드, 병명 태그 표시 |
| E2E-7 | "다시 분석하기" 클릭 | `/upload`로 복귀 |

**sessionStorage 주입 전략**:
```typescript
await page.addInitScript((data) => {
  sessionStorage.setItem('analysisResult', JSON.stringify(data));
}, mockAnalysisResult);
await page.goto('/result');
```

---

### Task 7 — Lighthouse CI GitHub Actions 연동 (1h)

#### 7-A. `lighthouserc.json` 작성

**파일**: `frontend/lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/upload"],
      "numberOfRuns": 1,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.7 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 3000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 4000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 600 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**임계값 근거**:
- LCP ≤ 4s (`error`): 정적 Next.js 앱에서 달성 가능한 현실적 기준선
- CLS ≤ 0.1 (`error`): 이미지 로딩 시 레이아웃 이동 없음 검증
- Performance ≥ 0.7 (`warn`): 무료 호스팅 환경 고려, 위반 시 경고만

#### 7-B. GitHub Actions 워크플로 작성

**파일**: `.github/workflows/lighthouse.yml`

```yaml
name: Lighthouse CI

on:
  push:
    branches: [sprint8, develop]
  pull_request:
    branches: [develop, master]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: 의존성 설치
        run: npm ci

      - name: Next.js 빌드
        run: npm run build

      - name: Next.js 서버 기동 (백그라운드)
        run: npm start &

      - name: 서버 기동 대기
        run: npx wait-on http://localhost:3000 --timeout 30000

      - name: Lighthouse CI 실행
        run: npx @lhci/cli@0.14.x autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

**`package.json` 스크립트 추가**:
```json
"lhci": "lhci autorun"
```

---

### Task 8 — CI 통합 및 전체 검증 (0.5h)

단위 테스트와 E2E 테스트를 기존 CI 파이프라인(`.github/workflows/ci.yml`)에 통합한다.

**`ci.yml` 프론트엔드 job 추가 항목**:
```yaml
- name: 단위 테스트 실행
  run: npm test -- --ci --passWithNoTests
  working-directory: frontend

- name: E2E 테스트 실행 (CI 모드)
  run: npx playwright test
  working-directory: frontend
  env:
    CI: true
```

**전체 검증 체크리스트**:
- `npm test` — 단위/컴포넌트 테스트 전체 통과
- `npm run test:e2e` — E2E 시나리오 7개 통과
- `npx lhci autorun` — LCP, CLS 기준 위반 없음

---

## 기술적 접근 방법

### React 19 + Next.js 16 Jest 호환성

Next.js의 `createJestConfig` 헬퍼를 사용하면 `next/navigation`, `next/image` 등의
자동 mock와 SWC 트랜스파일이 활성화된다.
React 19에서 `act()` 관련 경고가 발생하면 `@testing-library/react` 최신 버전을 사용한다.

### `useRouter` mock 패턴

```typescript
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));
```

### E2E에서 백엔드 없이 테스트

Playwright의 `page.route()`로 `POST /analyze`를 가로채 mock 응답을 반환한다.
실제 백엔드 없이도 프론트엔드 전체 플로우를 검증할 수 있다.

### Lighthouse CI 무료 업로드

`target: "temporary-public-storage"` 설정 시 LHCI 서버 없이 결과를 임시 공개 URL로 업로드한다.
PR 코멘트에 Lighthouse 리포트 링크가 자동 추가된다.

---

## 의존성 및 리스크

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| React 19 `act()` 경고로 테스트 불안정 | RTL 테스트 flaky | `@testing-library/react` 16.x+ 버전 사용, `waitFor` 적극 활용 |
| `URL.createObjectURL` jsdom 미지원 | UploadPage 테스트 실패 | `jest.setup.ts`에서 전역 mock으로 대응 (Task 4 참조) |
| Next.js App Router `useRouter` mock 복잡도 | 컴포넌트 테스트 실패 | `next/navigation` 전체 모듈 mock, 필요 메서드만 노출 |
| Playwright CI 실행 시간 | CI 속도 저하 | `numberOfRuns: 1`, Chromium 단일 브라우저, 병렬 실행 |
| Lighthouse CI 무료 서버 TTL | 리포트 링크 만료 | 프로젝트 내 중요 스크린샷을 `docs/sprint/sprint8/` 아카이브 |
| Next.js standalone 빌드와 Lighthouse CI 호환 | LH 실행 실패 | `npm start` 대신 `npx serve .next` 고려, 빌드 출력 확인 |

---

## 완료 기준 (Definition of Done)

- ✅ `npm test` — 단위/컴포넌트 테스트 전체 통과 (0개 실패, 26개 통과)
- ✅ `inferDiseases.test.ts` 7개 테스트 통과
- ✅ `api.test.ts` 5개 테스트 통과
- ✅ `UploadPage.test.tsx` 8개 테스트 통과
- ✅ `ResultPage.test.tsx` 6개 테스트 통과
- ✅ `npm run test:e2e` 설정 완료 (Playwright, CI에서 실행)
- ✅ `lhci autorun` 설정 완료 (GitHub Actions 연동)
- ✅ GitHub Actions CI에서 단위 테스트 자동 실행 확인 (`ci.yml` 프론트엔드 job 추가)
- ✅ `sprint8` 브랜치에서 작업 완료

---

## 예상 산출물

| 파일 | 설명 |
|------|------|
| `frontend/jest.config.ts` | Jest + Next.js 통합 설정 |
| `frontend/jest.setup.ts` | RTL jest-dom 확장 및 전역 mock |
| `frontend/__tests__/lib/inferDiseases.test.ts` | 순수 함수 단위 테스트 7개 |
| `frontend/__tests__/lib/api.test.ts` | fetch mock 기반 API 단위 테스트 5개 |
| `frontend/__tests__/components/UploadPage.test.tsx` | 컴포넌트 통합 테스트 8개 |
| `frontend/__tests__/components/ResultPage.test.tsx` | 컴포넌트 통합 테스트 6개 |
| `frontend/playwright.config.ts` | Playwright E2E 설정 |
| `frontend/e2e/upload-flow.spec.ts` | 업로드 플로우 E2E 시나리오 4개 |
| `frontend/e2e/result-page.spec.ts` | 결과 페이지 E2E 시나리오 3개 |
| `frontend/lighthouserc.json` | Lighthouse CI 임계값 설정 |
| `.github/workflows/lighthouse.yml` | Lighthouse CI GitHub Actions 워크플로 |

**총 신규 테스트**: 단위/컴포넌트 26개 + E2E 7개 = **33개**

---

## 검증 결과 (2026-03-16)

### 자동 검증

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm test` (단위/컴포넌트) | ✅ 26개 통과 | 4 suites, 0 실패, 0.712s |
| `inferDiseases.test.ts` | ✅ 7개 통과 | |
| `api.test.ts` | ✅ 5개 통과 | |
| `UploadPage.test.tsx` | ✅ 8개 통과 | |
| `ResultPage.test.tsx` | ✅ 6개 통과 | |
| GitHub Actions CI (`ci.yml`) | ✅ 설정 완료 | 프론트엔드 단위 테스트 job 추가 |
| Playwright E2E 설정 | ✅ 완료 | 7개 시나리오, CI 실행 |
| Lighthouse CI 설정 | ✅ 완료 | GitHub Actions 연동 |

### 수동 검증 필요

- ⬜ `npm run test:e2e` — 로컬 서버 기동 후 E2E 7개 시나리오 직접 확인
- ⬜ `npx lhci autorun` — 로컬에서 LCP/CLS 임계값 충족 여부 확인
- ⬜ GitHub Actions CI 실제 실행 결과 확인 (push 후)

---

## 참고

- 테스트 실행 환경: Node.js 22, Next.js 16, React 19, TypeScript 5
- E2E 실행: Chromium (headless)
- Lighthouse CI: `@lhci/cli` 0.14.x, `temporary-public-storage` 업로드
- 백엔드 의존성 없음 — 모든 테스트에서 API mock 사용
- 기존 백엔드 단위 테스트(`pytest backend/tests/ -v`) 영향 없음
