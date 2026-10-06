import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: {
    ...devices['Galaxy Tab S9 landscape'],
    baseURL: 'http://127.0.0.1:4173/MyMusicQuest/',
    // CHROMIUM_PATH: use a preinstalled browser instead of Playwright's download
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/MyMusicQuest/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
