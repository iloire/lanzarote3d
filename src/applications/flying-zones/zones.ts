import zonesConfig from './zones.json';
import { geoToWorld, ISLAND_ANCHOR } from '../../shared/geo';

/** A Lanzarote flying zone, as zones.json gives it (see README.md next to it) */
export interface FlyingZone {
  id: string;
  name: string;
  /** The takeoff */
  lat: number;
  lon: number;
  /** The wind it works in, as compass points: "N", "S-SE", "NE-E", or "Variable" */
  wind: string;
  altitude: string;
  /** The pin's wing */
  color: string;
  /** The relax scene it opens, when it has a hand-built one; otherwise its own, made from its id */
  scene?: string;
}

export const FLYING_ZONES: FlyingZone[] = zonesConfig.zones;

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/**
 * Degrees clockwise from north the wind blows from: a point's bearing, or the mean of a range's
 * two ends ("N-NW" is 337.5). Undefined for a variable wind or one it doesn't know.
 */
export const windBearing = (wind: string): number | undefined => {
  const bearings = wind.split('-').map(point => POINTS.indexOf(point.trim()) * 45);
  if (bearings.length > 2 || bearings.some(bearing => bearing < 0)) return undefined;
  const [from, to = from] = bearings as [number, number?];
  // The shorter way round, so N-NW lands between them and not at SSE
  const turn = ((to! - from + 540) % 360) - 180;
  return (from + turn / 2 + 360) % 360;
};

/** The relax scene a zone opens */
export const zoneScene = (zone: FlyingZone): string => zone.scene ?? zone.id;

/** The takeoff in world x, z on the island model */
export const zoneTakeoff = (zone: FlyingZone): { x: number; z: number } =>
  geoToWorld(zone.lat, zone.lon, ISLAND_ANCHOR);
