/**
 * Vehicle selection page: Add Vehicle flow (Year → Model → Body/Door → Add Vehicle) and categories URL assertion.
 * Dismisses banner and waits for page ready before interacting; body/door step is resilient (multiple selectors, skip if absent).
 */
import { Page, expect } from '@playwright/test';
import { dismissBanner } from '../utils/banner.util';
import type { VehicleData } from '../utils/vehicle.util';

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
    const short = { timeout: 6_000 };

    const tryBody = async (name: string | RegExp) => {
      const btn = this.page.getByRole('button', { name }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click(short);
        await this.delay(400);
        return true;
      }
      return false;
    };

    if (await tryBody(bodyButtonLabel)) {
      const door = this.doorOption(doorOptionLabel);
      await door.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      if (await door.isVisible().catch(() => false)) {
        await door.click(short);
        return true;
      }
    }
    if (await tryBody(/Body\b/)) {
      const door = this.doorOption(doorOptionLabel);
      await door.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
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
  private async waitForPageReady(timeout = 15_000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await dismissBanner(this.page);
    await this.delay(400);
    await expect(this.addVehicleBtn).toBeVisible({ timeout });
  }

  /**
   * Dismiss promo banner, then add vehicle. No reload – use current page so page objects stay in sync.
   * Flow: + Add Vehicle → Year → Model → Body (if data) → Door → Add Vehicle.
   */
  async addVehicle(year: string, vehicleData: VehicleData): Promise<void> {
    await this.waitForPageReady(15_000);

    const stepTimeout = { timeout: 10_000 };

    await this.addVehicleBtn.click(stepTimeout);
    await this.delay(300);

    await this.yearButton.click(stepTimeout);
    await this.yearOption(year).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    await this.yearOption(year).click(stepTimeout);
    await this.delay(300);

    await this.modelButton.click(stepTimeout);
    await this.modelOption(vehicleData.model).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    await this.modelOption(vehicleData.model).click(stepTimeout);
    await this.delay(500);

    if (vehicleData.bodyButtonLabel && vehicleData.doorOptionLabel) {
      const bodyClicked = await this.tryBodyAndDoorStep(
        vehicleData.bodyButtonLabel,
        vehicleData.doorOptionLabel,
        stepTimeout.timeout
      );
      if (!bodyClicked) await this.delay(300);
    }

    await this.finalAddVehicleBtn.click(stepTimeout);
  }

  /** Assert URL contains "categories" (assignment requirement). */
  async expectCategoriesUrl(): Promise<void> {
    await expect(this.page).toHaveURL(/.*categories.*/, { timeout: 15_000 });
  }
}
