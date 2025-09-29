import { Location as FlyLocation } from '../helpers/types';
import locations from './index';

// Load all locations
export const loadAllLocations = async (): Promise<FlyLocation[]> => {
  // Simply return the locations array from the index file
  return locations;
};

// Get a location by ID
export const getLocationById = async (id: string): Promise<FlyLocation | undefined> => {
  return locations.find(location => location.id === id);
};
