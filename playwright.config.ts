import { defineConfig } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: isCI,
  timeout: isCI ? 300_000 : 90_000,
  expect: { timeout: isCI ? 20_000 : 5_000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: isCI ? 0.5 : 1,
    screenshot: 'only-on-failure',
    // Keep call traces on CI without repeatedly capturing the software-rendered canvas.
    trace: { mode: 'retain-on-failure', screenshots: !isCI, snapshots: !isCI },
    launchOptions: {
      channel: process.env.PLAYWRIGHT_CHANNEL || (isCI ? undefined : 'chrome'),
      args: isCI ? ['--use-angle=swiftshader'] : [],
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !isCI,
  },
});
