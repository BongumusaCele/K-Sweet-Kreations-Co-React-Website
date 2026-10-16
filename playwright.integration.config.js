import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/integration',
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5175', headless: true },
  webServer: [
    {
      command: 'node ../K-Sweet-Kreations-Co-Web-API/tests/start-test-api.mjs',
      stdout: 'pipe',
      url: 'http://127.0.0.1:5089/api/website',
      timeout: 30000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort',
      stdout: 'pipe',
      url: 'http://127.0.0.1:5175',
      env: { API_PROXY_TARGET: 'http://127.0.0.1:5089' },
    },
  ],
  reporter: 'list',
})
