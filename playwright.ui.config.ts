import { defineConfig } from '@playwright/test'

/**
 * Packaged panel checks need no Meteor server. The shared extension fixture
 * always launches Chromium headlessly, including local runs.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'ui-layout.spec.ts',
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  outputDir: 'test-results/ui-layout',
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure' },
})
