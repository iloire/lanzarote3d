import { Location } from './index';
import locations from './index';

// Load all locations
export const loadAllLocations = async (): Promise<Location[]> => {
  // Simply return the locations array from the index file
  return locations;
};

// Get a location by ID
export const getLocationById = async (id: string): Promise<Location | undefined> => {
  return locations.find(location => location.id === id);
}; 