/**
 * From latitude and longitude to the scene's x/z. The island model is north-up (−z is north,
 * +x is east), so a local flat projection around one fitted point is enough at its size.
 */

/** A place whose world position is known, and how many world units a metre is */
export interface GeoAnchor {
  lat: number;
  lon: number;
  x: number;
  z: number;
  unitsPerMetre: number;
  /** Radians the map is turned clockwise (seen from above) to sit on the model, default 0 */
  rotation?: number;
}

const METRES_PER_DEGREE_LAT = 110574;
const METRES_PER_DEGREE_LON_AT_EQUATOR = 111320;

/**
 * Fitted on the model: Puerto del Carmen's harbour sits on the model's coast here, and the scale
 * puts Puerto Calero and the turn of the coast at Matagorda where the model has them.
 */
export const LANZAROTE_ANCHOR: GeoAnchor = {
  lat: 28.92117,
  lon: -13.67441,
  x: -3600,
  z: 12600,
  unitsPerMetre: 0.74,
};

/**
 * Fitted on the whole island: the OpenStreetMap coastline laid onto the model's sea-level
 * contour, scale and turn included. Within about 170 units of the model's coast from Playa
 * Blanca to Órzola, where LANZAROTE_ANCHOR drifts up to 1900 units off in the north. The
 * harbour keeps LANZAROTE_ANCHOR, which is closer at Puerto del Carmen itself.
 */
export const ISLAND_ANCHOR: GeoAnchor = {
  lat: 28.92117,
  lon: -13.67441,
  x: -2330,
  z: 12702,
  unitsPerMetre: 0.772,
  rotation: 0.0355,
};

export function geoToWorld(
  lat: number,
  lon: number,
  anchor: GeoAnchor = LANZAROTE_ANCHOR
): { x: number; z: number } {
  const east =
    (lon - anchor.lon) * Math.cos((anchor.lat * Math.PI) / 180) * METRES_PER_DEGREE_LON_AT_EQUATOR;
  const south = (anchor.lat - lat) * METRES_PER_DEGREE_LAT;
  const cos = Math.cos(anchor.rotation ?? 0);
  const sin = Math.sin(anchor.rotation ?? 0);
  return {
    x: anchor.x + (east * cos - south * sin) * anchor.unitsPerMetre,
    z: anchor.z + (east * sin + south * cos) * anchor.unitsPerMetre,
  };
}
