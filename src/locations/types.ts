import type { GeoAnchor } from '../shared/geo';
import type { GroundRegion } from '../foundation/rendering/regionTint';

/**
 * A place the scenes can be set in: its terrain and how the real world maps onto it.
 * TerrainBase loads the sky, the sea and this terrain; the place's own story (towns, pilots,
 * boats) stays in the apps that tell it.
 */
export interface Location {
  id: string;
  name: string;
  /** URL of the terrain GLB: positions and triangles only, see 3d/slim-glb.py */
  terrainModel: string;
  /** Uniform scale applied to the GLB to reach world units */
  terrainScale: number;
  terrainPosition: [number, number, number];
  /** Lat/lon → world x/z on this terrain */
  anchor: GeoAnchor;
  /** Ground colour patches, already projected into the scene */
  regions: GroundRegion[];
}
