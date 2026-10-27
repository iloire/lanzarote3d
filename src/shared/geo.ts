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

export function geoToWorld(
  lat: number,
  lon: number,
  anchor: GeoAnchor = LANZAROTE_ANCHOR
): { x: number; z: number } {
  const east =
    (lon - anchor.lon) * Math.cos((anchor.lat * Math.PI) / 180) * METRES_PER_DEGREE_LON_AT_EQUATOR;
  const north = (lat - anchor.lat) * METRES_PER_DEGREE_LAT;
  return {
    x: anchor.x + east * anchor.unitsPerMetre,
    z: anchor.z - north * anchor.unitsPerMetre,
  };
}
