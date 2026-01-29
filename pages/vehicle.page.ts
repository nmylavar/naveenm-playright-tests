/**
 * Vehicle selection page: Add Vehicle flow (Year → Model → Body/Door → Add Vehicle) and categories URL assertion.
 * Dismisses banner and waits for page ready before interacting; body/door step is resilient (multiple selectors, skip if absent).
 */
import { Page, expect } from '@playwright/test';
import { dismissBanner } from '../utils/banner.util';
import type { VehicleData } from '../utils/vehicle.util';
import {
  STEP_TIMEOUT_MS,
  OPTION_VISIBILITY_MS,
  VISIBILITY_TIMEOUT_MS,
  VEHICLE_AFTER_ADD_BTN_MS,
  VEHICLE_AFTER_YEAR_MS,
  VEHICLE_AFTER_MODEL_MS,
  VEHICLE_AFTER_BODY_MS,
  VEHICLE_AFTER_BODY_SKIP_MS,
  VEHICLE_PAGE_READY_SETTLE_MS,
  VEHICLE_CATEGORIES_URL_TIMEOUT_MS,
} from '../constants/waits';

export class VehiclePage {
  constructor(private readonly page: Page) {}

  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  get addVehicleBtn() {
    return this.page.getByRole('button', { name: '+ Add Vehicle' });
  }

  get yearButton() {
    return this.page.getByRole('button', { name: 'Year' });
  }

  yearOption(year: string) {
    return this.page.getByRole('option', { name: year });
  }

  get modelButton() {
    return this.page.getByRole('button', { name: 'Model' });
  }

  modelOption(model: string, exact = true) {
    return this.page.getByRole('option', { name: model, exact });
  }

  bodyButton(label: string) {
    return this.page.getByRole('button', { name: label });
  }

  doorOption(label: string) {
    return this.page.getByRole('option', { name: label });
  }

  /**
   * Try body + door step. Tries "Body Sport Utility" button, then "Body" dropdown, then door option.
   * Returns true if step completed; false if body/door not found (caller can skip and click Add Vehicle).
   */
  private async tryBodyAndDoorStep(
    bodyButtonLabel: string,
    doorOptionLabel: string,
    _timeoutMs: number
  ): Promise<boolean> {
    const short = { timeout: STEP_TIMEOUT_MS };

    const tryBody = async (name: string | RegExp) => {
      const btn = this.page.getByRole('button', { name }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click(short);
        await this.delay(VEHICLE_AFTER_BODY_MS);
        return true;
      }
      return false;
    };

    if (await tryBody(bodyButtonLabel)) {
      const door = this.doorOption(doorOptionLabel);
      await door.waitFor({ state: 'visible', timeout: OPTION_VISIBILITY_MS }).catch(() => {});
      if (await door.isVisible().catch(() => false)) {
        await door.click(short);
        return true;
      }
    }
    if (await tryBody(/Body\b/)) {
      const door = this.doorOption(doorOptionLabel);
      await door.waitFor({ state: 'visible', timeout: OPTION_VISIBILITY_MS }).catch(() => {});
      if (await door.isVisible().catch(() => false)) {
        await door.click(short);
        return true;
      }
    }
    return false;
  }

  get finalAddVehicleBtn() {
    return this.page.getByRole('button', { name: 'Add Vehicle', exact: true });
  }

  /** Wait for main content so locators see the current DOM (after navigation/login). */
  private async waitForPageReady(timeout = VISIBILITY_TIMEOUT_MS): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await dismissBanner(this.page);
    await this.delay(VEHICLE_PAGE_READY_SETTLE_MS);
    await expect(this.addVehicleBtn).toBeVisible({ timeout });
  }

  /**
   * Dismiss promo banner, then add vehicle. No reload – use current page so page objects stay in sync.
   * Flow: + Add Vehicle → Year → Model → Body (if data) → Door → Add Vehicle.
   */
  async addVehicle(year: string, vehicleData: VehicleData): Promise<void> {
    await this.waitForPageReady(VISIBILITY_TIMEOUT_MS);

    const stepTimeout = { timeout: STEP_TIMEOUT_MS };

    await this.addVehicleBtn.click(stepTimeout);
    await this.delay(VEHICLE_AFTER_ADD_BTN_MS);

    await this.yearButton.click(stepTimeout);
    await this.yearOption(year).waitFor({ state: 'visible', timeout: OPTION_VISIBILITY_MS }).catch(() => {});
    await this.yearOption(year).click(stepTimeout);
    await this.delay(VEHICLE_AFTER_YEAR_MS);

    await this.modelButton.click(stepTimeout);
    await this.modelOption(vehicleData.model).waitFor({ state: 'visible', timeout: OPTION_VISIBILITY_MS }).catch(() => {});
    await this.modelOption(vehicleData.model).click(stepTimeout);
    await this.delay(VEHICLE_AFTER_MODEL_MS);

    if (vehicleData.bodyButtonLabel && vehicleData.doorOptionLabel) {
      const bodyClicked = await this.tryBodyAndDoorStep(
        vehicleData.bodyButtonLabel,
        vehicleData.doorOptionLabel,
        STEP_TIMEOUT_MS
      );
      if (!bodyClicked) await this.delay(VEHICLE_AFTER_BODY_SKIP_MS);
    }

    await this.finalAddVehicleBtn.click(stepTimeout);
  }

  /** Assert URL contains "categories" (assignment requirement). */
  async expectCategoriesUrl(): Promise<void> {
    await expect(this.page).toHaveURL(/.*categories.*/, { timeout: VEHICLE_CATEGORIES_URL_TIMEOUT_MS });
  }

  /** Open Add Vehicle modal without selecting a vehicle. */
  async openAddVehicleModal(): Promise<void> {
    await this.waitForPageReady(VISIBILITY_TIMEOUT_MS);
    await this.addVehicleBtn.click({ timeout: STEP_TIMEOUT_MS });
    await this.delay(VEHICLE_AFTER_ADD_BTN_MS);
  }

  /** Dismiss Add Vehicle modal (Escape or backdrop) without adding. */
  async cancelAddVehicleModal(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.delay(VEHICLE_AFTER_BODY_SKIP_MS);
  }
}
