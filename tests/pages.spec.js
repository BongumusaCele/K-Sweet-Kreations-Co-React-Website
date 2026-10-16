import { test, expect } from '@playwright/test'
import { mockPublic } from './fixtures.js'
test('production assets and navigation work under a repository path', async ({
  page,
}) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await mockPublic(page)
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
  await page
    .getByRole('button', { name: 'Gallery', exact: true })
    .first()
    .click()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Moments worth celebrating' }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
