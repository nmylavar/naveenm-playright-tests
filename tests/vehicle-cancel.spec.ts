/**
 * Add Vehicle cancel flow: open modal, dismiss without adding, assert still on home.
 */
import { test, expect } from '../fixtures/fixtures';
import { VISIBILITY_TIMEOUT_MS } from '../constants/waits';

test('Vehicle: open Add Vehicle modal then cancel without adding', async ({ auth, vehicle, page }) => {
  await auth.login();
  await vehicle.openAddVehicleModal();
  await vehicle.cancelAddVehicleModal();

  await expect(vehicle.addVehicleBtn).toBeVisible({ timeout: VISIBILITY_TIMEOUT_MS });
  await expect(page).not.toHaveURL(/.*categories.*/);
});
