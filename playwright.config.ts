import { defineConfig, devices } from '@playwright/test';
import { getBaseUrl, getEnvFromProcess, getSiteFromProcess } from './utils/envUtils';
import path from 'path';
import fs from 'fs';

const env = getEnvFromProcess();
const site = getSiteFromProcess();
const storageDir = path.resolve(__dirname, 'storage');
const partsAuthState = path.join(storageDir, 'auth-parts.json');
const accessoriesAuthState = path.join(storageDir, 'auth-accessories.json');

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/, // only *.spec.ts files; do not run fixtures or other modules
  testIgnore: ['**/node_modules/**', '**/fixtures/**'],
  timeout: 90_000,
  retries: 0, // single run, no retry (set to 1 if you want retries)
  workers: 1,
  use: {
    headless: false,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 15_000,
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

