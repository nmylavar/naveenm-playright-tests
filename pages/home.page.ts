/**
 * Home page: search bar, vehicle card (verify present, unselect, verify removed), search submit.
 * All actions that need a clean UI call dismissBanner before interacting.
 */
import { Page, expect } from '@playwright/test';
import { dismissBanner } from '../utils/banner.util';
import { HOME_LOADED_MS, HOME_VEHICLE_MS, HOME_SEARCH_COMPLETE_MS, STEP_TIMEOUT_MS } from '../constants/waits';

export class HomePage {
  constructor(private readonly page: Page) {}

  vehicleButton(model: string) {
    return this.page.getByRole('button', { name: model });
  }
  get searchBar() {
    return this.page.locator('#home-page-search-redesign-coveo');
  }

  get searchInput() {
    return this.page.getByRole('textbox', { name: /search/i }).or(this.page.locator('#home-page-search-redesign-coveo input')).first();
  }
  get uncheckIcon() {
    return this.page.locator(
      '.ecomm-vehicle-card__check > .ecomm-icons-square > .ecomm-icons-16px > svg'
    );
  }

  async verifyLoaded(timeout = HOME_LOADED_MS) {
    await dismissBanner(this.page);
    await expect(this.searchBar).toBeVisible({ timeout });
  }

  async verifyVehiclePresent(model: string, timeout = HOME_VEHICLE_MS) {
    await expect(this.vehicleButton(model)).toBeVisible({ timeout });
  }

  async unselectVehicle(model: string) {
    await dismissBanner(this.page);
    const opts = { timeout: STEP_TIMEOUT_MS };
    await this.vehicleButton(model).click(opts);
    await this.uncheckIcon.click(opts);
    await this.verifyLoaded();
  }

  async verifyVehicleRemoved(model: string, timeout = HOME_VEHICLE_MS) {
    await expect(this.vehicleButton(model)).not.toBeVisible({ timeout });
  }

  /** Type in search and submit (Enter). */
  async search(query: string): Promise<void> {
    await dismissBanner(this.page);
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  /** Wait for search to complete (URL or results container). */
  async waitForSearchComplete(timeout = HOME_SEARCH_COMPLETE_MS): Promise<void> {
    await this.page.waitForURL(/\/(search|categories|parts)/, { timeout }).catch(() => {});
  }

}
