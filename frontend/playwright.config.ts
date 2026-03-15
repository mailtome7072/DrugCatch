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
      // 모바일 375px 반응형 검증 (iPhone SE)
      name: 'mobile-chrome',
      use: {
        ...devices['iPhone SE'],
        screenshot: 'on',  // 모바일은 항상 스크린샷 저장 (검증 기록용)
      },
    },
  ],
  outputDir: '../docs/sprint/sprint10/playwright-results',
});
