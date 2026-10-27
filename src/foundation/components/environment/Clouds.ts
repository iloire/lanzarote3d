import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { rndBetween, rndIntBetween } from '../../utils/math';
import { cloudMaterial } from '../../rendering/cloudMaterial';
import { buildCloudGeometry, CloudKind, padBounds } from './Cloud';

/** How far the clouds of a group spread round its centre, and how much their bases differ */
const SPREAD = 1100;
const BASE_JITTER = 25;

/**
 * A cluster of 2 to 6 cumulus sharing one cloud base, drawn as a single mesh. A tower
 * cluster, over a strong thermal, has one towering cloud among the puffs.
 */
class Clouds {
  private mesh: THREE.Mesh | null = null;

  constructor(private readonly kind: CloudKind = 'puff') {}

  /** `base` is where the cloud bases sit: the group's centre, at cloudbase height */
  async load(base: THREE.Vector3, scale = 1): Promise<THREE.Object3D> {
    const count = rndIntBetween(2, 6);
    const geometries = Array.from({ length: count }, (_, i) =>
      buildCloudGeometry(i === 0 ? this.kind : 'puff', {
        offset:
          i === 0
            ? new THREE.Vector3()
            : new THREE.Vector3(
                rndBetween(-1, 1) * SPREAD,
                rndBetween(-1, 1) * BASE_JITTER,
                rndBetween(-1, 1) * SPREAD
              ),
        yaw: rndBetween(0, Math.PI * 2),
      })
    );
    const geometry = mergeGeometries(geometries)!;
    geometries.forEach(g => g.dispose());
    padBounds(geometry);

    this.mesh = new THREE.Mesh(geometry, cloudMaterial);
    this.mesh.castShadow = true;
    this.mesh.position.copy(base);
    this.mesh.scale.setScalar(scale);
    return this.mesh;
  }

  dispose() {
    this.mesh?.geometry.dispose();
  }
}

export default Clouds;
