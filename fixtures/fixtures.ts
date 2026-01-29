/**
 * Custom Playwright fixtures for Chevrolet tests.
 * - page: extended with banner CSS hide and auto-dismiss on every navigation.
 * - auth, home, vehicle: page object instances (AuthPage, HomePage, VehiclePage).
 */
import { test as base } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { HomePage } from '../pages/home.page';
import { VehiclePage } from '../pages/vehicle.page';
import { dismissBanner, hideBannerByCss } from '../utils/banner.util';

type Fixtures = {
  auth: AuthPage;
  home: HomePage;
  vehicle: VehiclePage;
};

export const test = base.extend<Fixtures>({
  /** Ensures promo modal does not block clicks: inject CSS hide + dismiss on load and on every navigation. */
  page: async ({ page }, use) => {
    await hideBannerByCss(page);
    const tryDismiss = () => dismissBanner(page).catch(() => {});
    page.on('framenavigated', tryDismiss);
    await tryDismiss();
    await use(page);
    page.off('framenavigated', tryDismiss);
  },
  auth: async ({ page }, use) => {
    const auth = new AuthPage(page);
    await use(auth);
  },
  home: async ({ page }, use) => {
    const home = new HomePage(page);
    await use(home);
  },
  vehicle: async ({ page }, use) => {
    const vehicle = new VehiclePage(page);
    await use(vehicle);
  },
});

export const expect = test.expect;
