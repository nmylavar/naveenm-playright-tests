/**
 * Vehicle test data helpers: load from data/vehicles.json, get by year or random year.
 * Used by vehicle-selection.spec for data-driven add-vehicle flow.
 */
import vehiclesData from '../data/vehicles.json';

export interface VehicleData {
  model: string;
  bodyType?: string;
  bodyButtonLabel?: string;
  doorOptionLabel?: string;
}

const vehicles = vehiclesData as Record<string, VehicleData>;

export function getVehicleForYear(year: string): VehicleData {
  const data = vehicles[year];
  if (!data) throw new Error(`No vehicle data for year: ${year}`);
  return data;
}

export function getRandomVehicleYear(): string {
  const years = Object.keys(vehicles);
  return years[Math.floor(Math.random() * years.length)];
}

export function getAvailableYears(): string[] {
  return Object.keys(vehicles);
}
