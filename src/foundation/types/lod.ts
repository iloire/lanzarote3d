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
 * Polygon budget guidelines for each LOD level
 */
export const LOD_POLYGON_BUDGETS = {
  [LevelOfDetail.ULTRA_LOW]: { min: 10, max: 100, recommended: 50 },
  [LevelOfDetail.LOW]: { min: 100, max: 500, recommended: 300 },
  [LevelOfDetail.MEDIUM]: { min: 500, max: 2000, recommended: 1000 },
  [LevelOfDetail.HIGH]: { min: 2000, max: Infinity, recommended: 5000 },
} as const;

/**
 * Distance thresholds for automatic LOD selection (in world units)
 */
export const LOD_DISTANCE_THRESHOLDS = {
  ULTRA_LOW: 500,  // Use ULTRA_LOW beyond this distance
  LOW: 200,        // Use LOW beyond this distance
  MEDIUM: 50,      // Use MEDIUM beyond this distance
  HIGH: 0,         // Use HIGH below MEDIUM threshold
} as const;

/**
 * LOD labels for UI/debugging
 */
export const LOD_LABELS = {
  [LevelOfDetail.ULTRA_LOW]: 'Ultra Low',
  [LevelOfDetail.LOW]: 'Low',
  [LevelOfDetail.MEDIUM]: 'Medium',
  [LevelOfDetail.HIGH]: 'High',
} as const;

/**
 * Convert legacy lowPoly boolean to LOD level
 * Provides backward compatibility with existing code
 */
export function getLODFromLegacy(lowPoly?: boolean): LevelOfDetail {
  if (lowPoly === undefined) return LevelOfDetail.HIGH;
  return lowPoly ? LevelOfDetail.LOW : LevelOfDetail.HIGH;
}

/**
 * Select appropriate LOD based on distance from camera
 */
export function selectLODByDistance(distance: number): LevelOfDetail {
  if (distance > LOD_DISTANCE_THRESHOLDS.ULTRA_LOW) return LevelOfDetail.ULTRA_LOW;
  if (distance > LOD_DISTANCE_THRESHOLDS.LOW) return LevelOfDetail.LOW;
  if (distance > LOD_DISTANCE_THRESHOLDS.MEDIUM) return LevelOfDetail.MEDIUM;
  return LevelOfDetail.HIGH;
}

/**
 * Get polygon budget for a given LOD level
 */
export function getPolygonBudget(lod: LevelOfDetail): { min: number; max: number; recommended: number } {
  return LOD_POLYGON_BUDGETS[lod];
}

/**
 * Get label for LOD level
 */
export function getLODLabel(lod: LevelOfDetail): string {
  return LOD_LABELS[lod];
}

/**
 * Check if polygon count is within budget for LOD level
 */
export function isWithinBudget(polygonCount: number, lod: LevelOfDetail): boolean {
  const budget = LOD_POLYGON_BUDGETS[lod];
  return polygonCount >= budget.min && polygonCount <= budget.max;
}

/**
 * Get next higher LOD level (for progressive loading)
 */
export function getNextLOD(currentLOD: LevelOfDetail): LevelOfDetail | null {
  if (currentLOD >= LevelOfDetail.HIGH) return null;
  return currentLOD + 1;
}

/**
 * Get next lower LOD level (for performance degradation)
 */
export function getPreviousLOD(currentLOD: LevelOfDetail): LevelOfDetail | null {
  if (currentLOD <= LevelOfDetail.ULTRA_LOW) return null;
  return currentLOD - 1;
}
