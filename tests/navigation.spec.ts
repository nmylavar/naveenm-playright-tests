/**
 * Navigation & smoke tests.
 * - After-login home load and search bar visibility.
 * - Base URL load and banner dismissal (no auth).
 * - Smoke: unauthenticated home loads and Add Vehicle is available.
 */
import { test, expect } from '../fixtures/fixtures';
import { dismissBanner } from '../utils/banner.util';

test('Navigation: after login, home page loads with search bar visible', async ({ auth, home }) => {
  await auth.login();
  await home.verifyLoaded();
});

test('Navigation: base URL loads and banner can be dismissed', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
  await dismissBanner(page);
  await page.waitForLoadState('domcontentloaded');
});

test('Smoke: unauthenticated home loads and Add Vehicle is available', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await dismissBanner(page);
  await page.waitForLoadState('load').catch(() => {});
  const addVehicleBtn = page.getByRole('button', { name: '+ Add Vehicle' });
  await expect(addVehicleBtn).toBeVisible({ timeout: 15_000 });
});
