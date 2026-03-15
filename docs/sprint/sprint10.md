# Sprint 10 — 모바일 반응형 자동화 검증 (Playwright 모바일 viewport + Lighthouse CI 모바일 프리셋)

## 개요

| 항목 | 내용 |
|------|------|
| 스프린트 번호 | Sprint 10 |
| 브랜치 | `sprint10` |
| 기간 | 1일 |
| 작업 디렉토리 | `frontend/` |
| 선행 스프린트 | Sprint 8 (Playwright E2E 7개, Lighthouse CI desktop 설정 완료) |

---

## 배경 및 목적

프로젝트 평가에서 다음 지적을 받았다.

> "TailwindCSS max-w-md, px-4 등으로 모바일 375px 대응 시도. 다만 실제 모바일 기기 또는
> 브라우저 개발자도구에서 검증 기록이 deploy.md에 '⬜ 수동 검증 필요'로만 표시되어 있어
> 실제 반응형 동작 확인 불가."

Sprint 8에서 구축된 테스트 인프라(Playwright E2E, Lighthouse CI)는 Chromium desktop 환경만
대상으로 한다. 모바일 375px 반응형 동작이 코드상으로 시도되었으나 **자동화된 검증 기록이 없어**
실제 동작 여부를 객관적으로 증명할 수 없다.

이번 스프린트의 목적은 두 가지다.

1. **Playwright에 iPhone SE(375×667) 모바일 프로젝트 추가** — 기존 E2E 7개 시나리오를
   모바일 viewport에서도 실행하고, 페이지별 스크린샷을 자동 저장
2. **Lighthouse CI에 모바일 프리셋 추가** — 기존 desktop 측정에 mobile 측정을 병행하여
   모바일 성능 임계값 기준선 확보

---

## 스프린트 목표

- Playwright `projects`에 `mobile-chrome` 프로젝트(iPhone SE, 375×667) 추가
- 기존 E2E 7개 시나리오가 모바일 viewport에서 모두 통과
- 모바일 E2E 각 단계에서 스크린샷이 `docs/sprint/sprint10/` 에 자동 저장
- `lighthouserc.json`에 모바일 프리셋 수집 항목 추가
- 검증 결과(스크린샷, Lighthouse 점수)를 본 문서의 "검증 결과" 섹션에 기록

---

## 구현 범위

### 포함

- `frontend/playwright.config.ts` — `mobile-chrome` 프로젝트 추가 (iPhone SE device)
- 기존 E2E 스펙(`upload-flow.spec.ts`, `result-page.spec.ts`) — 스크린샷 저장 로직 추가
- `frontend/lighthouserc.json` — 모바일 프리셋 수집 항목 추가
- `docs/sprint/sprint10/` 디렉토리 — 모바일 스크린샷 아카이브

### 제외

- UI 디자인 변경 (반응형 레이아웃 코드 수정이 필요한 경우만 최소 수정, 범위 제한)
- 새 기능 추가
- 새 E2E 시나리오 작성 (기존 7개 재활용)
- 타 브라우저(Firefox, WebKit) 모바일 추가

---

## 작업 분해 (Task Breakdown)

### Task 1 — Playwright 모바일 프로젝트 추가 (1h)

**대상 파일**: `frontend/playwright.config.ts`

**변경 내용**: `projects` 배열에 `mobile-chrome` 프로젝트 추가

```typescript
import { defineConfig, devices } from '@playwright/test';

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
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['iPhone SE'] },
    },
  ],
});
```

**기술 근거**:
- `devices['iPhone SE']`는 Playwright 내장 device descriptor로, viewport 375×667,
  `userAgent` 모바일 문자열, `isMobile: true`, `hasTouch: true`가 사전 설정되어 있다.
- 별도 스펙 파일 없이 기존 7개 시나리오가 `mobile-chrome` 프로젝트에서도 자동 실행된다.

**완료 기준**: `npx playwright test --project=mobile-chrome` 실행 시 7개 시나리오 모두 통과

---

### Task 2 — 모바일 스크린샷 자동 저장 설정 (1h)

**목적**: 모바일 viewport 렌더링 결과를 `docs/sprint/sprint10/`에 자동 아카이빙하여
검증 기록으로 사용

**전략**: 기존 E2E 스펙에 `test.use()` 블록과 `screenshot` 옵션을 추가하되, 모바일 프로젝트
실행 시에만 스크린샷을 저장한다. `playwright.config.ts`의 `outputDir` 옵션을
`docs/sprint/sprint10/` 으로 지정한다.

**`playwright.config.ts` 모바일 프로젝트 추가 설정**:

```typescript
{
  name: 'mobile-chrome',
  use: {
    ...devices['iPhone SE'],
    screenshot: 'on',          // 모바일 항상 스크린샷
  },
  outputDir: '../docs/sprint/sprint10/',
},
```

**스크린샷 저장 경로**: `docs/sprint/sprint10/{test-name}-{n}.png`

**주의 사항**:
- `outputDir`은 playwright.config.ts 기준 상대 경로이며, `frontend/` 가 CWD이므로
  `../docs/sprint/sprint10/`으로 설정한다.
- 스크린샷 파일명은 Playwright가 테스트명 기반으로 자동 생성한다.

**완료 기준**: `npx playwright test --project=mobile-chrome` 실행 후
`docs/sprint/sprint10/` 에 PNG 스크린샷이 저장됨

---

### Task 3 — Lighthouse CI 모바일 프리셋 추가 (0.5h)

**대상 파일**: `frontend/lighthouserc.json`

**현재 설정**: desktop 프리셋 단일 수집

**변경 내용**: 모바일 프리셋 수집 항목 추가

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/upload"],
      "numberOfRuns": 1,
      "settings": [
        {
          "preset": "desktop"
        },
        {
          "preset": "perf",
          "emulatedFormFactor": "mobile",
          "throttling": {
            "rttMs": 40,
            "throughputKbps": 10240,
            "cpuSlowdownMultiplier": 1
          }
        }
      ]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.5 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 4000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 6000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 1200 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**임계값 근거**:
- 모바일 네트워크/CPU 환경을 고려하여 desktop 기준보다 완화된 값 적용
- LCP ≤ 6s (`error`): 모바일 4G 환경 현실적 기준
- CLS ≤ 0.1 (`error`): desktop과 동일 — 이미지 로딩 레이아웃 이동 없음
- Performance ≥ 0.5 (`warn`): 모바일 저성능 에뮬레이션 고려
- `cpuSlowdownMultiplier: 1` — GitHub Actions 환경에서 과도한 CPU 스로틀링 방지

**완료 기준**: `npx @lhci/cli@0.14.x autorun` 실행 시 모바일 측정 결과 포함, LCP/CLS 에러 없음

---

### Task 4 — docs/sprint/sprint10 디렉토리 생성 및 README 작성 (0.25h)

**목적**: Playwright 스크린샷 저장 대상 디렉토리 사전 생성

**작업**:
- `docs/sprint/sprint10/` 디렉토리 생성
- `.gitkeep` 파일 추가 (빈 디렉토리 git 추적용)

**완료 기준**: 디렉토리 존재, git에 추적됨

---

### Task 5 — 로컬 검증 실행 및 결과 기록 (1h)

**목적**: 모든 설정이 실제로 동작하는지 로컬에서 실행하고 결과를 문서화

**실행 순서**:

1. `npm run dev` (별도 터미널에서 실행)
2. `npx playwright test --project=mobile-chrome` — 7개 시나리오 통과 확인
3. `docs/sprint/sprint10/` 에 스크린샷 저장 확인
4. `npx @lhci/cli@0.14.x autorun` — 모바일/desktop 양쪽 측정 확인

**결과 기록**: 본 문서 "검증 결과" 섹션에 테스트 통과 수, 스크린샷 파일 목록, Lighthouse 점수 기록

---

## 기술적 접근 방법

### Playwright devices['iPhone SE'] 활용

Playwright의 `devices` 맵에는 실제 기기 스펙이 사전 정의되어 있다.

```
iPhone SE:
  viewport: { width: 375, height: 667 }
  userAgent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 ...) AppleWebKit/...
  isMobile: true
  hasTouch: true
  deviceScaleFactor: 2
```

이를 그대로 사용하면 별도 viewport 설정 없이 375px 모바일 환경이 구성된다.
기존 E2E 시나리오는 `page.goto()`, `page.locator()`, `page.getByText()` 등 viewport 독립적인
API를 사용하므로 수정 없이 모바일 프로젝트에서 재사용 가능하다.

### Lighthouse CI 다중 settings 배열

`lighthouserc.json`의 `collect.settings`를 배열로 지정하면 동일 URL에 대해
여러 프리셋으로 순차 측정한다. `assert` 섹션은 두 측정 결과 중 더 나쁜 값에 적용된다.
따라서 모바일 기준을 desktop보다 완화하여 설정한다.

### 스크린샷 저장 전략

- `screenshot: 'on'` — 모바일 프로젝트 전용 설정, 모든 테스트 단계 후 자동 캡처
- `outputDir: '../docs/sprint/sprint10/'` — `frontend/playwright.config.ts` 기준 상대 경로

---

## 의존성 및 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 모바일 touch 이벤트로 인한 기존 E2E 실패 | 중 | `isMobile` 환경에서 `click()`은 tap으로 자동 변환됨. 실패 시 해당 assertion만 최소 수정 |
| `lighthouserc.json` settings 배열 문법 LHCI 버전 의존 | 중 | `@lhci/cli@0.14.x` 기준으로 작성. 실패 시 desktop/mobile을 별도 `lighthouserc-mobile.json`으로 분리 |
| GitHub Actions에서 모바일 E2E 실행 시간 증가 | 낮음 | `numberOfRuns: 1`, 단일 spec 재사용이므로 추가 비용 최소화 |
| `outputDir` 경로 오류 (상대 경로 해석) | 낮음 | 로컬 검증 시 실제 파일 저장 여부로 확인. 절대 경로로 대체 가능 |

---

## 완료 기준 (Definition of Done)

- ✅ `playwright.config.ts`에 `mobile-chrome` 프로젝트 추가 완료 (iPhone SE 375×667)
- ✅ `lighthouserc.json` 모바일 프리셋 설정 추가 완료
- ✅ `docs/sprint/sprint10/` 디렉토리 생성 완료
- ⬜ `npx playwright test --project=chromium` — 기존 7개 E2E 모두 통과 (회귀 없음) — CI에서 실행
- ⬜ `npx playwright test --project=mobile-chrome` — 7개 E2E 모두 통과 — CI에서 실행
- ⬜ `docs/sprint/sprint10/` 에 모바일 스크린샷 저장 확인
- ⬜ `npx @lhci/cli@0.14.x autorun` 실행 시 LCP, CLS 에러 기준 위반 없음 — CI에서 실행

---

## 예상 산출물

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `frontend/playwright.config.ts` | 수정 | `mobile-chrome` 프로젝트 추가 (iPhone SE, screenshot: 'on', outputDir) |
| `frontend/lighthouserc.json` | 수정 | 모바일 프리셋 settings 배열 추가 |
| `docs/sprint/sprint10/.gitkeep` | 신규 | 스크린샷 저장 디렉토리 추적용 |
| `docs/sprint/sprint10/*.png` | 신규 | Playwright 모바일 E2E 스크린샷 (검증 후 커밋) |

---

## 검증 결과

> 이 섹션은 Sprint 10 구현 완료 후 채워집니다.

### 자동 검증

| 항목 | 결과 | 비고 |
|------|------|------|
| `npx playwright test --project=chromium` (7개) | ⬜ | 회귀 없음 확인 |
| `npx playwright test --project=mobile-chrome` (7개) | ⬜ | 375px iPhone SE |
| `npx @lhci/cli@0.14.x autorun` (desktop) | ⬜ | LCP, CLS 기준 충족 |
| `npx @lhci/cli@0.14.x autorun` (mobile) | ⬜ | LCP ≤ 6s, CLS ≤ 0.1 |

### 모바일 스크린샷

| 파일 | 시나리오 |
|------|---------|
| (검증 후 기록) | E2E-1: 업로드 페이지 — 모바일 탭 표시 |
| (검증 후 기록) | E2E-2: 파일 업로드 → 미리보기 |
| (검증 후 기록) | E2E-3: 허용되지 않는 파일 형식 에러 |
| (검증 후 기록) | E2E-4: 분석 API mock → 결과 페이지 이동 |
| (검증 후 기록) | E2E-5: sessionStorage 없이 /result 접근 → /upload 리다이렉트 |
| (검증 후 기록) | E2E-6: 정상 결과 데이터 → 약품 카드 표시 |
| (검증 후 기록) | E2E-7: 다시 분석하기 클릭 → /upload 복귀 |

---

## 참고

- 선행 스프린트: Sprint 8 (`docs/sprint/sprint8.md`)
- 기존 E2E 스펙: `frontend/e2e/upload-flow.spec.ts`, `frontend/e2e/result-page.spec.ts`
- Playwright devices 참조: https://playwright.dev/docs/emulation#devices
- `@lhci/cli` 버전: 0.14.x
