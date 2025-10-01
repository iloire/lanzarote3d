import * as THREE from 'three';
import { ParagliderVoxel } from '../../foundation/components/vehicles';
import type { ParagliderVoxelConfig } from './config';

export interface VehicleLoadResult {
  mesh: THREE.Object3D;
}

/**
 * Loads paraglider vehicles into the scene
 */
export async function loadParagliders(
  scene: THREE.Scene,
  configs: ParagliderVoxelConfig[],
  errorHandler: (error: Error, context: string) => void
): Promise<VehicleLoadResult[]> {
  const results: VehicleLoadResult[] = [];

  const voxelPromises = configs.map(async (p) => {
    try {
      const paraglider = new ParagliderVoxel(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.01;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      results.push({ mesh });
      return mesh;
    } catch (error) {
      errorHandler(error as Error, 'loading voxel paraglider');
      return null;
    }
  });

  await Promise.all(voxelPromises);
  return results;
}
