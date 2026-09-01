import { defineConfig } from '@playwright/test'

const METEOR_FIXTURE_URL = 'http://127.0.0.1:2100'
const METEOR_STARTUP_TIMEOUT_MS = 180_000

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: METEOR_FIXTURE_URL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'yarn devapp',
    url: METEOR_FIXTURE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: METEOR_STARTUP_TIMEOUT_MS,
  },
})
