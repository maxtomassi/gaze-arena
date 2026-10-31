import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4310);
/** The built dist/ is served from a subpath, like a real deployment. */
const BASE = '/__GAME_ID__/';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // Rendering runs in software (SwiftShader); too many parallel pages starve the game loop.
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORT}${BASE}`,
    viewport: { width: 1280, height: 720 },
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
    },
  },
  webServer: {
    command: `node ../../scripts/serve-subpath.mjs --dir dist --base ${BASE} --port ${PORT}`,
    url: `http://localhost:${PORT}${BASE}`,
    reuseExistingServer: !process.env.CI,
  },
});
