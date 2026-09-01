import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  chromium,
  test as base,
  type BrowserContext,
  type Worker,
} from '@playwright/test'

const CHROME_EXTENSION_DIRECTORY = path.resolve('.output/chrome-mv3')
const CHROME_EXTENSION_MANIFEST = path.join(
  CHROME_EXTENSION_DIRECTORY,
  'manifest.json',
)
const EXTENSION_PROTOCOL = 'chrome-extension:'

interface ExtensionFixtures {
  extensionId: string
  extensionWorker: Worker
}

const launchExtensionContext = async (): Promise<BrowserContext> => {
  if (!existsSync(CHROME_EXTENSION_MANIFEST)) {
    throw new Error(
      `Chrome extension build not found at ${CHROME_EXTENSION_MANIFEST}. Run yarn build:chrome first.`,
    )
  }

  return chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${CHROME_EXTENSION_DIRECTORY}`,
      `--load-extension=${CHROME_EXTENSION_DIRECTORY}`,
    ],
  })
}

export const test = base.extend<ExtensionFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires fixture dependencies to use object destructuring.
  context: async ({}, provide) => {
    const context = await launchExtensionContext()

    try {
      await provide(context)
    } finally {
      await context.close()
    }
  },
  extensionWorker: async ({ context }, provide) => {
    const extensionWorker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'))

    await provide(extensionWorker)
  },
  extensionId: async ({ extensionWorker }, provide) => {
    const workerUrl = new URL(extensionWorker.url())

    if (workerUrl.protocol !== EXTENSION_PROTOCOL) {
      throw new Error(`Unexpected extension worker URL: ${workerUrl.href}`)
    }

    await provide(workerUrl.hostname)
  },
})

export { expect } from '@playwright/test'
