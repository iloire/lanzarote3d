import * as THREE from 'three';
import { ParagliderVoxel } from '../../foundation/components/vehicles';
import { Hangglider } from '../../foundation/components/vehicles';
import { Cessna } from '../../foundation/components/vehicles';
import { FlyingBehavior } from '../../foundation/systems/behaviors/FlyingBehavior';
import { logger } from '../../foundation/utils/logger';
import type {
  ParagliderVoxelConfig,
  HanggliderConfig,
  CessnaConfig,
} from './config';

export interface VehicleLoadResult {
  mesh: THREE.Object3D;
  flyingBehavior?: FlyingBehavior;
}

const DEBUG_VECTORS = true;
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

/**
 * Loads a hangglider vehicle with flying behavior
 */
export async function loadHangglider(
  scene: THREE.Scene,
  config: HanggliderConfig,
  animationDurationMs: number,
  errorHandler: (error: Error, context: string) => void
): Promise<VehicleLoadResult | null> {
  try {
    const hangglider = new Hangglider({ scale: config.scale });
    const mesh = await hangglider.load();
    mesh.position.copy(config.position);
    scene.add(mesh);

    const flyingBehavior = new FlyingBehavior({
      pattern: config.flightPattern,
      speed: config.speed,
      turnSpeed: config.turnSpeed,
      flightRadius: config.flightRadius,
      returnDistance: config.returnDistance,
      minHeight: config.minHeight,
      maxHeight: config.maxHeight,
      obstacleAvoidanceDistance: config.obstacleAvoidanceDistance,
      centerPoint: config.position,
      autoStart: true,
      faceDirection: true,
      forwardAxis: config.forwardAxis,
      debugVectors: DEBUG_VECTORS
    });

    flyingBehavior.attachTo(mesh);

    // Start flying behavior after animation completes
    setTimeout(() => {
      flyingBehavior.start();
      logger.info('🪂 Flying behavior started for hangglider');
    }, animationDurationMs + 2000);

    logger.info('✅ Hangglider loaded successfully with flying behavior');

    return { mesh, flyingBehavior };
  } catch (error) {
    errorHandler(error as Error, 'loading hangglider');
    return null;
  }
}

/**
 * Loads a Cessna aircraft with flying behavior
 */
export async function loadCessna(
  scene: THREE.Scene,
  config: CessnaConfig,
  animationDurationMs: number,
  errorHandler: (error: Error, context: string) => void
): Promise<VehicleLoadResult | null> {
  try {
    const cessna = new Cessna({
      scale: config.scale,
      bodyColor: config.bodyColor,
      wingColor: config.wingColor,
      propellerColor: config.propellerColor,
      windowColor: config.windowColor,
      stripeColor: config.stripeColor,
    });

    const mesh = await cessna.load();
    mesh.position.copy(config.position);
    scene.add(mesh);

    const flyingBehavior = new FlyingBehavior({
      pattern: config.flightPattern,
      speed: config.speed,
      turnSpeed: config.turnSpeed,
      flightRadius: config.flightRadius,
      returnDistance: config.returnDistance,
      minHeight: config.minHeight,
      maxHeight: config.maxHeight,
      obstacleAvoidanceDistance: config.obstacleAvoidanceDistance,
      centerPoint: config.position,
      autoStart: true,
      faceDirection: true,
      forwardAxis: config.forwardAxis,
      debugVectors: DEBUG_VECTORS
    });

    flyingBehavior.attachTo(mesh);

    // Start flying behavior after animation completes
    setTimeout(() => {
      flyingBehavior.start();
      logger.info('✈️ Flying behavior started for Cessna');
    }, animationDurationMs + 3000); // Start 3 seconds after animation ends

    logger.info('✅ Cessna loaded successfully with flying behavior');

    return { mesh, flyingBehavior };
  } catch (error) {
    errorHandler(error as Error, 'loading Cessna');
    return null;
  }
}
