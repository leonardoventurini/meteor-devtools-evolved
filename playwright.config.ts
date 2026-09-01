import { defineConfig } from '@playwright/test'
import path from 'node:path'
import { resolveMeteorFixture } from './tests/e2e/MeteorFixtures'

const METEOR_STARTUP_TIMEOUT_MS = 300_000
const meteorFixture = resolveMeteorFixture()

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        [
          'html',
          {
            open: 'never',
            outputFolder: path.join('playwright-report', meteorFixture.id),
          },
        ],
        ['list'],
      ]
    : 'list',
  outputDir: path.join('test-results', meteorFixture.id),
  use: {
    baseURL: meteorFixture.url,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  webServer: {
    command: meteorFixture.startCommand,
    url: meteorFixture.url,
    reuseExistingServer: !process.env.CI,
    timeout: METEOR_STARTUP_TIMEOUT_MS,
  },
})
