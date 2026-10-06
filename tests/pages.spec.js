import { test, expect } from '@playwright/test'
test('production build works under the GitHub repository path', async ({
  browser,
}) => {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto(
    'http://127.0.0.1:4174/K-Sweet-Kreations-Co-React-Website/',
  )
  expect(response.status()).toBe(200)
  await expect(
    page.getByRole('heading', { name: /Celebrate life/ }),
  ).toBeVisible()
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded()
    await expect(image).toHaveJSProperty('complete', true)
    await expect(image).not.toHaveJSProperty('naturalWidth', 0)
  }
  const broken = await page
    .locator('img')
    .evaluateAll((images) =>
      images
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src),
    )
  expect(broken).toEqual([])
  await page
    .getByRole('button', { name: 'Gallery', exact: true })
    .first()
    .click()
  await expect(
    page.getByRole('heading', { name: 'Moments worth celebrating' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Moments worth celebrating' }),
  ).toBeVisible()
  await page.getByLabel('Preview role').selectOption('Admin')
  await expect(
    page.getByRole('heading', { name: 'Hello, bakery team.' }),
  ).toBeVisible()
  expect(errors).toEqual([])
  await page.close()
})
