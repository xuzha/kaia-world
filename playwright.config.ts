import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: process.env.CI ? 180_000 : 90_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    // Filmstrip captures repeatedly read back the software-rendered WebGL canvas on CI.
    trace: { mode: 'retain-on-failure', screenshots: !process.env.CI },
    launchOptions: { channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
});
