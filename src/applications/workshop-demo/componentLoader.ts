import * as THREE from 'three';
import {
  Igloo,
  IglooSize,
  Pool,
  Stone,
  SaguaroCactus,
  BarrelCactus,
  PricklyPearCactus,
  OrganPipeCactus,
} from '../../foundation/components/scenery';
import type {
  TreeConfig,
  StoneConfig,
  CactusConfig,
  IglooConfig,
  PoolConfig,
  GroundConfig,
} from './config';
import { GROUND_LEVEL } from './config';

export interface ComponentLoadResult {
  mesh: THREE.Object3D;
  label: string;
  position: THREE.Vector3;
}

/**
 * Loads igloo component
 */
export async function loadIgloo(
  scene: THREE.Scene,
  config: IglooConfig,
  errorHandler: (error: Error, context: string) => void
): Promise<ComponentLoadResult | null> {
  try {
    const igloo = new Igloo(IglooSize.Medium);
    const iglooMesh = igloo.load();
    iglooMesh.position.copy(config.position);
    iglooMesh.scale.setScalar(config.scale);
    scene.add(iglooMesh);

    return {
      mesh: iglooMesh,
      label: 'Igloo',
      position: new THREE.Vector3(config.position.x, -10, config.position.z),
    };
  } catch (error) {
    errorHandler(error as Error, 'loading igloo');
    return null;
  }
}

/**
 * Loads tree components
 */
export async function loadTrees(
  scene: THREE.Scene,
  configs: TreeConfig[],
  errorHandler: (error: Error, context: string) => void
): Promise<ComponentLoadResult[]> {
  const results: ComponentLoadResult[] = [];

  for (const config of configs) {
    try {
      const tree = new config.component();
      const treeMesh = tree.load();
      treeMesh.scale.setScalar(config.scale);
      treeMesh.position.set(
        config.position[0] ?? 0,
        GROUND_LEVEL,
        config.position[2] ?? 0
      );
      scene.add(treeMesh);

      results.push({
        mesh: treeMesh,
        label: config.label,
        position: new THREE.Vector3(config.position[0], -10, config.position[2]),
      });
    } catch (error) {
      errorHandler(error as Error, `loading ${config.label}`);
    }
  }

  return results;
}

/**
 * Loads stone components
 */
export async function loadStones(
  scene: THREE.Scene,
  configs: StoneConfig[],
  errorHandler: (error: Error, context: string) => void
): Promise<ComponentLoadResult[]> {
  const results: ComponentLoadResult[] = [];

  for (const config of configs) {
    try {
      const stone = new Stone();
      const stoneMesh = stone.load();
      stoneMesh.position.set(
        config.position[0] ?? 0,
        GROUND_LEVEL,
        config.position[2] ?? 0
      );
      stoneMesh.scale.set(config.scale[0] ?? 1, config.scale[1] ?? 1, config.scale[2] ?? 1);
      scene.add(stoneMesh);

      results.push({
        mesh: stoneMesh,
        label: config.label,
        position: new THREE.Vector3(config.position[0], -10, config.position[2]),
      });
    } catch (error) {
      errorHandler(error as Error, `loading ${config.label}`);
    }
  }

  return results;
}

/**
 * Loads pool component
 */
export async function loadPool(
  scene: THREE.Scene,
  config: PoolConfig,
  errorHandler: (error: Error, context: string) => void
): Promise<ComponentLoadResult | null> {
  try {
    const pool = new Pool();
    const poolMesh = await pool.load();
    poolMesh.position.copy(config.position);
    poolMesh.scale.setScalar(config.scale);
    scene.add(poolMesh);

    return {
      mesh: poolMesh,
      label: 'Pool',
      position: new THREE.Vector3(config.position.x, -10, config.position.z),
    };
  } catch (error) {
    errorHandler(error as Error, 'loading pool');
    return null;
  }
}

/**
 * Loads cactus components
 */
export async function loadCacti(
  scene: THREE.Scene,
  configs: CactusConfig[],
  errorHandler: (error: Error, context: string) => void
): Promise<ComponentLoadResult[]> {
  const results: ComponentLoadResult[] = [];

  for (const config of configs) {
    try {
      let cactus;

      switch (config.type) {
        case 'Saguaro':
          cactus = new SaguaroCactus({ scale: config.scale, lowPoly: config.lowPoly });
          break;
        case 'Barrel':
          cactus = new BarrelCactus({ scale: config.scale, lowPoly: config.lowPoly });
          break;
        case 'PricklyPear':
          cactus = new PricklyPearCactus({ scale: config.scale, lowPoly: config.lowPoly });
          break;
        case 'OrganPipe':
          cactus = new OrganPipeCactus({ scale: config.scale, lowPoly: config.lowPoly });
          break;
        default:
          continue;
      }

      const cactusMesh = await cactus.load();
      cactusMesh.position.set(
        config.position[0] ?? 0,
        GROUND_LEVEL,
        config.position[2] ?? 0
      );
      scene.add(cactusMesh);

      results.push({
        mesh: cactusMesh,
        label: config.label,
        position: new THREE.Vector3(config.position[0], -10, config.position[2]),
      });
    } catch (error) {
      errorHandler(error as Error, `loading ${config.label}`);
    }
  }

  return results;
}

/**
 * Loads ground plane
 */
export function loadGround(
  scene: THREE.Scene,
  config: GroundConfig,
  errorHandler: (error: Error, context: string) => void
): ComponentLoadResult | null {
  try {
    const groundGeometry = new THREE.PlaneGeometry(config.size.width, config.size.height);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = config.position.y;
    scene.add(ground);

    return {
      mesh: ground,
      label: 'Workshop Ground',
      position: config.labelPosition,
    };
  } catch (error) {
    errorHandler(error as Error, 'creating workshop ground');
    return null;
  }
}
