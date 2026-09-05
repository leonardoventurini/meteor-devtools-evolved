import { expect, test } from './fixtures'

const TOOLBAR_HEIGHT = 40
const SIDEBAR_WIDTH = 160
const STATUS_HEIGHT = 29
const MINIMUM_PANEL_WIDTH = 600
const VIEWPORT_HEIGHT = 720

interface PanelMessageScope {
  chrome: {
    devtools: unknown
    runtime: { connect: (options: { name: string }) => unknown }
  }
  deliverPanelMessage(message: unknown): void
}

test('keeps subscription columns bounded and JSON inspection interactive', async ({
  page,
}) => {
  /**
   * Supply the DevTools host bridge only. The packaged store, subscription
   * rendering, drawer, and JSON controls process the normal snapshot message.
   */
  await page.addInitScript(() => {
    const scope = globalThis as unknown as PanelMessageScope
    const connect = scope.chrome.runtime.connect.bind(scope.chrome.runtime)
    scope.chrome.devtools = { inspectedWindow: { tabId: 1, eval() {} } }
    scope.chrome.runtime.connect = options =>
      options.name === 'panel'
        ? {
            postMessage() {},
            onMessage: {
              addListener(listener: (message: unknown) => void) {
                scope.deliverPanelMessage = listener
              },
            },
          }
        : connect(options)
  })
  await page.reload()
  const name = Array.from(
    { length: 12 },
    (_, index) => `publication${index}`,
  ).join('.')
  const params = [
    {
      nested: { match: 'needle-value', other: 'excluded-value' },
      array: [1, 2, 3],
    },
  ]
  await page.evaluate(
    ({ name, params }) => {
      const scope = globalThis as unknown as PanelMessageScope
      scope.deliverPanelMessage({
        eventType: 'sync-subscriptions',
        data: {
          connectionId: 'default',
          subscriptions: JSON.stringify({
            sample: {
              id: 'sample',
              name,
              params,
              inactive: false,
              ready: true,
            },
          }),
        },
      })
    },
    { name, params },
  )
  await page.getByRole('button', { name: 'Subscriptions', exact: true }).click()
  const table = page.getByRole('table')
  await expect(table).toBeVisible()
  await expect(table).toHaveCSS('table-layout', 'fixed')
  const row = table.getByRole('row').filter({ hasText: name })
  const nameTag = row.locator('[title]').filter({ hasText: name })
  await expect(nameTag).toHaveCSS('text-overflow', 'ellipsis')
  await expect(nameTag).toHaveCSS('white-space', 'nowrap')
  expect(
    await nameTag
      .locator('span')
      .evaluate(element => element.scrollWidth > element.clientWidth),
  ).toBe(true)
  const tableBox = await table.boundingBox()
  expect(tableBox?.width).toBe(1280 - SIDEBAR_WIDTH)
  await expect(row.getByRole('cell').nth(3)).toHaveText('true')
  await expect(row.getByRole('cell').nth(4)).toHaveText('true')
  await row.getByRole('cell').first().click()
  const expand = page.getByRole('button', { name: 'Expand all JSON nodes' })
  await expect(expand).toBeVisible()
  await expand.click()
  await expect(page.getByText('"needle-value"', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Collapse all JSON nodes' }).click()
  await expect(page.getByText('"needle-value"', { exact: true })).toBeHidden()
  const filter = page.getByRole('searchbox', {
    name: 'Filter JSON keys and values',
  })
  await filter.fill('needle')
  await expect(page.locator('mark')).toHaveText('needle')
  await expect(page.getByText('"excluded-value"', { exact: true })).toBeHidden()
  await filter.fill('absent-value')
  await expect(
    page
      .getByRole('status', { name: '' })
      .filter({ hasText: 'No matching keys or values.' }),
  ).toBeVisible()
})

test.beforeEach(async ({ page, extensionId }) => {
  // Remote repository metadata must not make toolbar geometry nondeterministic.
  await page.route('https://**/*', route => route.abort())
  await page.goto(`chrome-extension://${extensionId}/devtools-panel.html`)
})

for (const width of [1280, 480]) {
  test(`preserves shell geometry and Settings padding at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
    const toolbar = page.locator('.mde-top-toolbar')
    const sidebar = page.getByRole('navigation', { name: 'Panel navigation' })
    const content = page.locator('.mde-ddp').first()

    await expect(toolbar).toHaveCSS('height', `${TOOLBAR_HEIGHT}px`)
    const connectionTrigger = page.locator('.mde-connection-trigger')
    // The toolbar border occupies one pixel of the full-height control's parent.
    await expect(connectionTrigger).toHaveCSS(
      'height',
      `${TOOLBAR_HEIGHT - 1}px`,
    )
    await expect(connectionTrigger).toHaveCSS('padding', '0px 10px')
    const connectionSelector = page.locator('.mde-connection-selector')
    await expect(connectionSelector).toHaveCSS('min-width', '108px')
    await expect(connectionSelector).toHaveCSS('max-width', '192px')
    await expect(sidebar).toHaveCSS('width', `${SIDEBAR_WIDTH}px`)
    await expect(content).toHaveCSS(
      'height',
      `${VIEWPORT_HEIGHT - TOOLBAR_HEIGHT - STATUS_HEIGHT}px`,
    )
    const contentBox = await content.boundingBox()
    expect(contentBox?.x).toBe(SIDEBAR_WIDTH)
    expect(contentBox?.y).toBe(TOOLBAR_HEIGHT)
    expect(contentBox?.width).toBe(
      Math.max(width, MINIMUM_PANEL_WIDTH) - SIDEBAR_WIDTH,
    )
    await expect(page.getByRole('textbox', { name: 'Search...' })).toHaveCSS(
      'height',
      `${STATUS_HEIGHT}px`,
    )

    const settingsButton = sidebar.getByRole('button', { name: 'Settings' })
    await expect(settingsButton).toBeInViewport()
    await expect(settingsButton).toHaveCSS('height', '32px')
    const settingsButtonBox = await settingsButton.boundingBox()
    expect(settingsButtonBox?.y).toBe(VIEWPORT_HEIGHT - 32)
    await settingsButton.click()
    const settings = page
      .getByRole('heading', { name: 'Settings', exact: true })
      .locator('..')
    await expect(settings).toBeVisible()
    const padding = Math.min(24, Math.max(16, width * 0.03))
    await expect(settings).toHaveCSS('padding-left', `${padding}px`)
    await expect(settings).toHaveCSS('padding-top', `${padding}px`)
    await expect(content).toBeHidden()
    await expect(
      page.getByRole('heading', { name: 'Settings', exact: true }),
    ).toBeInViewport()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(Math.max(width, MINIMUM_PANEL_WIDTH))
  })
}

test('retains shared input, keyboard navigation and portaled controls', async ({
  page,
}) => {
  const search = page.getByRole('textbox', { name: 'Search...' })
  await search.focus()
  await expect(search).toBeFocused()
  await search.fill('layout check')
  await expect(search).toHaveValue('layout check')
  await expect(search).toHaveCSS('color', 'rgb(238, 238, 238)')

  const filter = page.getByRole('button', { name: 'Filter', exact: true })
  await filter.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('checkbox', { name: 'Heartbeat' })).toBeVisible()
  await page.keyboard.press('Escape')

  const settings = page.getByRole('button', { name: 'Settings', exact: true })
  await settings.focus()
  await page.keyboard.press('Enter')
  await expect(settings).toHaveClass(/active/)
  await page.getByText('Start from now', { exact: true }).click()
  const dialog = page.getByRole('alertdialog', {
    name: 'Reload DevTools panel?',
  })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveCSS('width', '440px')
  await dialog.getByRole('button', { name: 'Later' }).click()
  await expect(dialog).toBeHidden()
})

test('preserves shell colors and shared button hover styles', async ({
  page,
}, testInfo) => {
  const toolbar = page.locator('.mde-top-toolbar')
  const sidebar = page.getByRole('navigation', { name: 'Panel navigation' })
  const inactive = sidebar.getByRole('button', { name: 'Bookmarks' })
  const active = sidebar.getByRole('button', { name: 'DDP', exact: true })
  const filter = page.getByRole('button', { name: 'Filter', exact: true })
  const colors: Record<string, string> = {}
  for (const [name, locator] of Object.entries({
    toolbar,
    sidebar,
    inactive,
    active,
    filter,
    body: page.locator('body'),
  })) {
    colors[name] = await locator.evaluate(
      element => getComputedStyle(element).backgroundColor,
    )
  }
  await inactive.hover()
  colors.inactiveHover = await inactive.evaluate(
    element => getComputedStyle(element).backgroundColor,
  )
  await filter.hover()
  colors.filterHover = await filter.evaluate(
    element => getComputedStyle(element).backgroundColor,
  )
  colors.bodyClass = (await page.locator('body').getAttribute('class')) ?? ''
  expect(colors).toEqual({
    toolbar: 'rgb(32, 43, 51)',
    sidebar: 'rgb(32, 43, 51)',
    inactive: 'rgba(0, 0, 0, 0)',
    active: 'rgb(52, 69, 82)',
    filter: 'rgba(0, 0, 0, 0)',
    body: 'rgb(48, 64, 77)',
    inactiveHover: 'rgb(42, 56, 67)',
    filterHover: 'rgba(0, 0, 0, 0.2)',
    bodyClass: '',
  })
  await testInfo.attach('computed-style-baseline', {
    body: JSON.stringify(colors, null, 2),
    contentType: 'application/json',
  })
  await expect(toolbar).toHaveCSS('background-color', 'rgb(32, 43, 51)')
  await expect(sidebar).toHaveCSS('background-color', 'rgb(32, 43, 51)')
})
