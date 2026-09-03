import { expect, test } from './fixtures'

test('persists the DDP startup history option', async ({
  extensionId,
  page,
}) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`)

  const showHistory = page.getByRole('radio', {
    name: 'Show captured history',
  })
  const startFromNow = page.getByRole('radio', { name: 'Start from now' })

  await expect(showHistory).toBeChecked()
  await page.getByText('Start from now', { exact: true }).click()
  await expect(startFromNow).toBeChecked()

  await page.reload()

  await expect(startFromNow).toBeChecked()
})
