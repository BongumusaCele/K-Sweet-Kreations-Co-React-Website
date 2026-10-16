import { test, expect } from '@playwright/test'
import { mockPublic } from '../fixtures.js'

test.beforeEach(async ({ page }) => mockPublic(page))
test('public catalogue, cart calculations and account gate', async ({
  page,
}) => {
  await page.goto('/#shop')
  await expect(page.locator('.product-card')).toHaveCount(2)
  await page.getByRole('button', { name: 'Add to cart' }).first().click()
  await page.getByRole('button', { name: 'Cart, 1 items' }).click()
  await page.getByRole('button', { name: 'Increase Chocolate Luxe' }).click()
  await expect(page.locator('.summary-total')).toContainText(/720/)
  await page.getByRole('button', { name: 'Proceed to checkout' }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
  await expect(page.getByLabel('Email address')).toHaveValue('')
})
test('catalogue filters and empty state', async ({ page }) => {
  await page.goto('/#shop')
  await page.getByRole('button', { name: 'Cupcakes', exact: true }).click()
  await expect(page.locator('.product-card')).toHaveCount(1)
  await page
    .getByRole('textbox', { name: 'Search products' })
    .fill('nothing matches')
  await expect(
    page.getByRole('heading', { name: 'No treats found' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.locator('.product-card')).toHaveCount(2)
})
test('failed login shows server message without opening an account', async ({
  page,
}) => {
  await page.route('**/api/Auth/login', (route) =>
    route.fulfill({
      status: 401,
      json: { message: 'Invalid email or password.' },
    }),
  )
  await page.goto('/#account')
  await page.getByLabel('Email address').fill('test@example.com')
  await page.getByLabel('Password', { exact: true }).fill('WrongPassword')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Invalid email or password.',
  )
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
})
test('unavailable API offers retry and never falls back to local sample orders', async ({
  page,
}) => {
  await page.route('**/api/website', (route) => route.abort())
  await page.goto('/#shop')
  await expect(page.getByRole('alert')).toContainText('Unable to reach')
  await expect(page.locator('.product-card')).toHaveCount(0)
  await page.unroute('**/api/website')
  await mockPublic(page)
  await page.getByRole('button', { name: 'Refresh records' }).click()
  await expect(page.locator('.product-card')).toHaveCount(2)
})
