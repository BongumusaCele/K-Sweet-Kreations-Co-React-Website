import { test, expect } from '@playwright/test'
test('public catalogue, cart calculations and account gate', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /Celebrate life/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Explore our cakes ↗' }).click()
  await page.getByRole('button', { name: 'Add to cart' }).first().click()
  await page.getByRole('button', { name: 'Cart, 1 items' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your cart (1)' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Increase Chocolate Luxe' }).click()
  await expect(page.getByText('R 720,00').first()).toBeVisible()
  await page.getByRole('button', { name: 'Proceed to checkout' }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
  await page.getByLabel('Password', { exact: true }).fill('Preview123')
  await page
    .getByRole('button', { name: 'Sign in — preview', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Collection checkout' }),
  ).toBeVisible()
})
test('catalogue filters and empty state', async ({ page }) => {
  await page.goto('/#shop')
  await page.getByRole('button', { name: 'Cupcakes', exact: true }).click()
  await expect(page.locator('.product-card')).toHaveCount(2)
  await page
    .getByRole('textbox', { name: 'Search products' })
    .fill('nothing matches')
  await expect(
    page.getByRole('heading', { name: 'No treats found' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.locator('.product-card')).toHaveCount(8)
})
test('customer order ownership and mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#tracking')
  await page
    .getByRole('button', { name: 'Sign in or create an account' })
    .click()
  await page.getByLabel('Email address').fill('another@example.com')
  await page.getByLabel('Password', { exact: true }).fill('Preview123')
  await page
    .getByRole('button', { name: 'Sign in — preview', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'No matching orders yet' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: 'test-results/customer-mobile.png',
    fullPage: true,
  })
})
