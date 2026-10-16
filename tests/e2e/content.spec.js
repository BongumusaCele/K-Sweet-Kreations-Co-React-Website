import { test, expect } from '@playwright/test'
import { mockPublic } from '../fixtures.js'
test.beforeEach(async ({ page }) => mockPublic(page))
test('enquiry failure preserves input and only successful submission shows confirmation', async ({
  page,
}) => {
  let fail = true
  await page.route('**/api/website/enquiries', (route) =>
    fail
      ? route.fulfill({
          status: 500,
          json: { detail: 'Please try again later.' },
        })
      : route.fulfill({ status: 204 }),
  )
  await page.goto('/#contact')
  await page.getByLabel('Your name').fill('Test Customer')
  await page.getByLabel('Email address').fill('test@example.com')
  await page.getByLabel('Subject').fill('Birthday cake')
  await page.getByLabel('Your message').fill('Can you make a birthday cake?')
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Please try again later.')
  await expect(page.getByLabel('Your message')).toHaveValue(
    'Can you make a birthday cake?',
  )
  fail = false
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your enquiry has been sent' }),
  ).toBeVisible()
})
test('gallery uses catalogue images and mobile layout fits', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#gallery')
  await expect(page.locator('.gallery-grid button')).toHaveCount(2)
  await page.locator('.gallery-grid button').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
