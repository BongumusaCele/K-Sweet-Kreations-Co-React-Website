import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  testMatch: 'pages.spec.js',
  use: { headless: true },
  webServer: {
    env: { VITE_BASE_PATH: '/K-Sweet-Kreations-Co-React-Website/' },
    command: 'npm run preview -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174/K-Sweet-Kreations-Co-React-Website/',
    reuseExistingServer: !process.env.CI,
  },
  reporter: 'list',
})
