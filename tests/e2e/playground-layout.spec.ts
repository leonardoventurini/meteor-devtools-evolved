import type { RunCommand } from '../../src/Playground/Commands'
import type { RunRecord } from '../../src/Playground/RunRecord'
import { expect, test } from './fixtures'

const SECTIONS = ['Run', 'History'] as const
const PAGE_EPOCH = 'playground-layout'

interface PlaygroundHost {
  chrome: {
    devtools: unknown
    runtime: { connect: () => unknown }
  }
  deliverPanelMessage(message: unknown): void
  pendingRun?: RunCommand
}

test.beforeEach(async ({ page, extensionId }) => {
  await page.route('https://**/*', route => route.abort())
  await page.addInitScript(
    ({ epoch }) => {
      const host = globalThis as unknown as PlaygroundHost
      const send = (data: unknown) =>
        host.deliverPanelMessage({ eventType: 'playground:event', data })

      host.chrome.devtools = {
        inspectedWindow: {
          tabId: 1,
          eval(expression: string) {
            const prefix = '__meteor_devtools_evolved_receiveMessage('

            if (!expression.startsWith(prefix)) return
            const message = JSON.parse(expression.slice(prefix.length, -1)) as {
              eventType: string
              data: RunCommand | { kind: string; panelSessionId: string }
            }

            if (message.eventType === 'playground:hello') {
              send({ kind: 'hello', pageEpoch: epoch })
            } else if (message.eventType === 'playground:command') {
              if (message.data.kind === 'open') {
                send({
                  kind: 'session',
                  pageEpoch: epoch,
                  panelSessionId: message.data.panelSessionId,
                })
              } else if (message.data.kind === 'run') {
                host.pendingRun = message.data as RunCommand
              }
            }
          },
        },
      }
      host.chrome.runtime.connect = () => ({
        postMessage() {},
        onMessage: {
          addListener(listener: (message: unknown) => void) {
            host.deliverPanelMessage = listener
          },
        },
      })
    },
    { epoch: PAGE_EPOCH },
  )
  await page.goto(`chrome-extension://${extensionId}/devtools-panel.html`)
  await page.evaluate(epoch => {
    const host = globalThis as unknown as PlaygroundHost

    host.deliverPanelMessage({
      eventType: 'connections:get',
      data: { connections: [{ id: 'default', displayName: 'Default' }] },
    })
    host.deliverPanelMessage({
      eventType: 'ddp-event',
      data: {
        id: 'layout-example',
        connectionId: 'default',
        pageEpoch: epoch,
        content: JSON.stringify({
          msg: 'method',
          method: 'demo.echo',
          params: [{ sample: 1 }],
        }),
        isOutbound: true,
        timestamp: 1,
      },
    })
  }, PAGE_EPOCH)
  await page.getByRole('button', { name: 'Playground', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Target connection', exact: true })
    .selectOption('default')
})

test('presents two focused surfaces and progressively discloses tools', async ({
  page,
}) => {
  const tabs = page.getByRole('tablist', { name: 'Playground sections' })
  const name = page.getByRole('combobox', {
    name: 'Method or publication name',
    exact: true,
  })
  const parameters = page.getByRole('textbox', {
    name: 'Parameters (encoded EJSON array)',
    exact: true,
  })

  await expect(tabs.getByRole('tab')).toHaveText([...SECTIONS])
  await expect(
    page.getByRole('tabpanel', { name: 'Run', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('combobox', { name: 'Execution mode', exact: true }),
  ).toBeHidden()
  await name.fill('demo.draft')
  await parameters.fill('[{"draft":true}]')
  await page.getByText('Execution settings', { exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Session label', exact: true })
    .fill('Draft account')
  await tabs.getByRole('tab', { name: 'Run', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    tabs.getByRole('tab', { name: 'History', exact: true }),
  ).toBeFocused()
  await expect(
    page.getByRole('tabpanel', { name: 'History', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('End')
  await expect(
    tabs.getByRole('tab', { name: 'History', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(
    tabs.getByRole('tab', { name: 'Run', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(
    tabs.getByRole('tab', { name: 'History', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Home')
  await expect(name).toHaveValue('demo.draft')
  await expect(parameters).toHaveValue('[{"draft":true}]')
  await expect(
    page.getByRole('textbox', { name: 'Session label', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'Session label', exact: true }),
  ).toHaveValue('Draft account')
  await page.getByText('Advanced testing', { exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Matrix definition (JSON)', exact: true })
    .fill('{"includeBaseline":true,"changes":[]}')
  await page
    .getByRole('checkbox', {
      name: 'Continue after server error or failed expectation',
    })
    .check()
  await tabs.getByRole('tab', { name: 'History', exact: true }).click()
  await tabs.getByRole('tab', { name: 'Run', exact: true }).click()
  await expect(
    page.getByRole('textbox', {
      name: 'Matrix definition (JSON)',
      exact: true,
    }),
  ).toHaveValue('{"includeBaseline":true,"changes":[]}')
  await expect(
    page.getByRole('checkbox', {
      name: 'Continue after server error or failed expectation',
    }),
  ).toBeChecked()
  await page.getByText('Browse observed endpoints', { exact: true }).click()
  await page
    .getByRole('button', { name: 'Edit example 1', exact: false })
    .click()
  await expect(
    tabs.getByRole('tab', { name: 'Run', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(name).toHaveValue('demo.echo')
  await expect
    .poll(async () => JSON.parse(await parameters.inputValue()))
    .toEqual([{ sample: 1 }])
})

for (const width of [1440, 800]) {
  test(`prioritizes results with responsive request placement at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    const editor = page
      .getByRole('heading', { name: 'Request editor', exact: true })
      .locator('xpath=ancestor::section[1]')
    const results = page.getByRole('region', {
      name: 'Runs and results',
      exact: true,
    })
    const editorBox = await editor.boundingBox()
    const resultsBox = await results.boundingBox()

    expect(editorBox).not.toBeNull()
    expect(resultsBox).not.toBeNull()
    if (!editorBox || !resultsBox)
      throw new Error('Missing request/results geometry')
    if (width === 1440) {
      expect(Math.abs(editorBox.y - resultsBox.y)).toBeLessThan(2)
      expect(resultsBox.x).toBeGreaterThanOrEqual(editorBox.x + editorBox.width)
      expect(resultsBox.width).toBeGreaterThan(editorBox.width)
    } else {
      expect(resultsBox.y).toBeGreaterThanOrEqual(
        editorBox.y + editorBox.height,
      )
      expect(Math.abs(editorBox.x - resultsBox.x)).toBeLessThan(2)
    }
    await page.screenshot({
      path: testInfo.outputPath(`playground-${width}.png`),
      fullPage: true,
    })
  })
}

for (const outcome of ['success', 'error'] as const) {
  test(`shows ${outcome} responses and warnings without background updates changing tabs`, async ({
    page,
  }, testInfo) => {
    await page
      .getByRole('combobox', {
        name: 'Method or publication name',
        exact: true,
      })
      .fill('demo.echo')
    await page.getByRole('button', { name: 'Run method', exact: true }).click()
    await page.getByRole('tab', { name: 'History', exact: true }).click()
    await page.evaluate(outcome => {
      const host = globalThis as unknown as PlaygroundHost
      const request = host.pendingRun

      if (!request)
        throw new Error(
          'No registered run request received through host bridge',
        )
      const record: RunRecord = {
        request,
        sequence: 1,
        startedAt: 1000,
        updatedAt: 1042,
        phase: 'settled',
        finished: true,
        endpointLabel: 'Local demo endpoint',
        authentication: {
          state: 'anonymous',
          observedAt: 1000,
          provenance: 'UI fixture',
        },
        evidence: {
          data:
            outcome === 'success'
              ? { result: { message: 'Demo response visible' } }
              : {
                  error: {
                    error: 'not-authorized',
                    reason: 'Demo access denied',
                  },
                },
          outcome,
          completePaths: [''],
          redactedPaths: [],
          truncated: false,
          documentBaseline: 'known',
        },
        reasons: ['Demo warning remains visible'],
      }

      host.deliverPanelMessage({
        eventType: 'playground:event',
        data: { kind: 'run', record },
      })
    }, outcome)
    await expect(
      page.getByRole('tab', { name: 'History', exact: true }),
    ).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('tab', { name: 'Run', exact: true }).click()
    const results = page.getByRole('region', {
      name: 'Runs and results',
      exact: true,
    })

    await expect(
      results.getByLabel('Response data', { exact: true }),
    ).toContainText(
      outcome === 'success' ? 'Demo response visible' : 'Demo access denied',
    )
    await expect(
      results.getByText(`settled · ${outcome}`, { exact: true }),
    ).toBeVisible()
    await expect(
      results.getByText('42 ms elapsed', { exact: true }),
    ).toBeVisible()
    await expect(
      results.getByText('Demo warning remains visible', { exact: true }),
    ).toBeVisible()
    await expect(
      results.getByLabel('Run evidence', { exact: true }),
    ).toBeHidden()
    await results.getByText('Run details', { exact: true }).click()
    await expect(
      results.getByLabel('Run evidence', { exact: true }),
    ).toBeVisible()
    await results.getByText('Run details', { exact: true }).click()
    await page.screenshot({
      path: testInfo.outputPath(`playground-${outcome}.png`),
      fullPage: true,
    })
  })
}
