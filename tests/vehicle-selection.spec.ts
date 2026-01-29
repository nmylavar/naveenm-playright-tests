/**
 * Vehicle selection E2E: add vehicle (data-driven), assert categories URL, verify home, unselect.
 * Uses random year from data/vehicles.json; no logout at end (test ends after unselect).
 */
import { test } from '../fixtures/fixtures';
import { getVehicleForYear, getRandomVehicleYear } from '../utils/vehicle.util';

test('Vehicle selection: add vehicle, verify URL and home, unselect', async ({ auth, vehicle, home }) => {
  await auth.login();

  const year = getRandomVehicleYear();
  const vehicleData = getVehicleForYear(year);

  await vehicle.addVehicle(year, vehicleData);
  await vehicle.expectCategoriesUrl();

  await home.verifyLoaded();
  await home.verifyVehiclePresent(vehicleData.model);

  await home.unselectVehicle(vehicleData.model);
  await home.verifyVehicleRemoved(vehicleData.model);
});

