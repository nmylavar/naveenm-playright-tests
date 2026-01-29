import { defineConfig, devices } from '@playwright/test';
import { getBaseUrl, getEnvFromProcess, getSiteFromProcess } from './utils/envUtils';
import path from 'path';
import fs from 'fs';
import { ACTION_TIMEOUT_MS } from './constants/waits';

const env = getEnvFromProcess();
const site = getSiteFromProcess();
const storageDir = path.resolve(__dirname, 'storage');
const partsAuthState = path.join(storageDir, 'auth-parts.json');
const accessoriesAuthState = path.join(storageDir, 'auth-accessories.json');

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  testIgnore: ['**/node_modules/**', '**/fixtures/**'],
  timeout: 90_000,
  retries: 1,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['./reporters/customReporter.ts'],
  ],
  use: {
    headless: false,
    viewport: { width: 1280, height: 800 },
    actionTimeout: ACTION_TIMEOUT_MS,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    baseURL: getBaseUrl(env, site),
    permissions: ['geolocation'],
    geolocation: { latitude: 37.7749, longitude: -122.4194 },
  },
  projects: [
    {
      name: 'chromium-parts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getBaseUrl(env, 'parts'),
        ...(fs.existsSync(partsAuthState) ? { storageState: partsAuthState } : {}),
      },
    },
    {
      name: 'chromium-accessories',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getBaseUrl(env, 'accessories'),
        ...(fs.existsSync(accessoriesAuthState) ? { storageState: accessoriesAuthState } : {}),
      },
    },
  ],
});

