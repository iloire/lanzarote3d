/**
 * Level of Detail (LOD) System
 *
 * Defines multiple detail levels for 3D objects to optimize performance
 * based on distance from camera or performance requirements.
 */

/**
 * Level of Detail enum
 *
 * ULTRA_LOW: 10-100 polygons - For very distant objects (>500 units)
 * LOW: 100-500 polygons - For medium distance objects (200-500 units)
 * MEDIUM: 500-2000 polygons - For normal viewing distance (50-200 units)
 * HIGH: 2000+ polygons - For close-up viewing (<50 units)
 */
export enum LevelOfDetail {
  ULTRA_LOW = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

/**
 * Convert legacy lowPoly boolean to LOD level
 * Provides backward compatibility with existing code
 */
export function getLODFromLegacy(lowPoly?: boolean): LevelOfDetail {
  if (lowPoly === undefined) return LevelOfDetail.HIGH;
  return lowPoly ? LevelOfDetail.LOW : LevelOfDetail.HIGH;
}
