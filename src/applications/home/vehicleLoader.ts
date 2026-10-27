import * as THREE from 'three';
import { ParagliderVoxel } from '../../foundation/components/vehicles';
import { Hangglider } from '../../foundation/components/vehicles';
import { Cessna } from '../../foundation/components/vehicles';
import { Hercules } from '../../foundation/components/vehicles';
import { FlyingBehavior, FlightPattern } from '../../foundation/systems/behaviors/FlyingBehavior';
import { SmokeTrail } from '../../foundation/components/effects/SmokeTrail';
import { logger } from '../../foundation/utils/logger';
import { ParagliderMotion } from './paragliderMotion';
import type {
  ParagliderVoxelConfig,
  HanggliderConfig,
  CessnaConfig,
  HerculesConfig,
} from './config';
import { RIDGE_LOOP, RIDGE_LOOP_TENSION, PARAGLIDER_SPEED } from './config';

export interface VehicleLoadResult {
  mesh: THREE.Object3D;
  flyingBehavior?: FlyingBehavior;
  smokeTrail?: SmokeTrail;
  motion?: ParagliderMotion;
}

const DEBUG_VECTORS = false;

/** A closed loop of waypoints to fly, and how tightly the curve through them turns */
export interface FlightLoop {
  waypoints: THREE.Vector3[];
  tension: number;
}

/**
 * Loads the paragliders, each flying its copy of the loop (the Famara ridge loop unless another
 * is given) from its own start point. They are placed on the loop straight away and fly from the
 * first frame.
 */
export async function loadParagliders(
  scene: THREE.Scene,
  configs: ParagliderVoxelConfig[],
  errorHandler: (error: Error, context: string) => void,
  loop: FlightLoop = { waypoints: RIDGE_LOOP, tension: RIDGE_LOOP_TENSION }
): Promise<VehicleLoadResult[]> {
  const loaded = await Promise.all(
    configs.map(async (p): Promise<VehicleLoadResult | null> => {
      try {
        const paraglider = new ParagliderVoxel(p.options);
        const mesh = await paraglider.load();
        const scale = 0.01;
        mesh.scale.set(scale, scale, scale);

        // FlyingBehavior owns the rig's rotation, so the paraglider keeps its own inside it,
        // and ParagliderMotion banks and sways the body between the two and swings the pilot.
        const rig = new THREE.Group();
        rig.name = `paraglider-${p.options.pilot.characterType}`;
        const body = new THREE.Group();
        body.add(mesh);
        rig.add(body);
        scene.add(rig);

        const flyingBehavior = new FlyingBehavior({
          pattern: FlightPattern.WAYPOINT,
          speed: PARAGLIDER_SPEED,
          turnSpeed: 1.0,
          forwardAxis: '-z',
          debugVectors: DEBUG_VECTORS,
          waypoints: loop.waypoints.map(point => point.clone().add(p.pathOffset)),
          waypointTension: loop.tension,
          waypointLoop: true,
          waypointStartProgress: p.startProgress,
        });
        flyingBehavior.attachTo(rig);
        flyingBehavior.snapToWaypointCurve();
        flyingBehavior.start();

        return {
          mesh: rig,
          flyingBehavior,
          motion: new ParagliderMotion(rig, body, PARAGLIDER_SPEED, paraglider.getPilotSwing()),
        };
      } catch (error) {
        errorHandler(error as Error, 'loading voxel paraglider');
        return null;
      }
    })
  );

  const results = loaded.filter((r): r is VehicleLoadResult => r !== null);
  logger.info(`Loaded ${results.length} paraglider(s)`);
  return results;
}

/**
 * Loads the hangglider on its raised copy of the ridge loop. It flies from the first frame
 * and banks into turns like the paragliders.
 */
export async function loadHangglider(
  scene: THREE.Scene,
  config: HanggliderConfig,
  errorHandler: (error: Error, context: string) => void
): Promise<VehicleLoadResult | null> {
  try {
    const mesh = await new Hangglider({ scale: config.scale }).load();
    // The model's nose points along +X; turn it to fly along -Z like the paragliders' rig
    mesh.rotation.y = Math.PI / 2;

    const rig = new THREE.Group();
    rig.name = 'hangglider';
    const body = new THREE.Group();
    body.add(mesh);
    rig.add(body);
    scene.add(rig);

    const flyingBehavior = new FlyingBehavior({
      pattern: FlightPattern.WAYPOINT,
      speed: config.speed,
      turnSpeed: 1.0,
      forwardAxis: '-z',
      debugVectors: DEBUG_VECTORS,
      waypoints: config.waypoints,
      waypointTension: config.waypointTension,
      waypointLoop: true,
    });
    flyingBehavior.attachTo(rig);
    flyingBehavior.snapToWaypointCurve();
    flyingBehavior.start();

    return { mesh: rig, flyingBehavior, motion: new ParagliderMotion(rig, body, config.speed) };
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
      debugVectors: DEBUG_VECTORS,
      waypoints: config.waypoints,
      waypointTension: config.waypointTension,
      waypointLoop: config.waypointLoop,
    });

    flyingBehavior.attachTo(mesh);

    const smokeTrail = new SmokeTrail({
      emissionRate: 4,
      particleLifetime: 5,
      initialSize: 1,
      finalSize: 5,
      color: new THREE.Color(0xdddddd),
      maxParticles: 100,
      turbulence: 0.6,
      enabled: false,
    });
    scene.add(smokeTrail.getGroup());

    setTimeout(() => {
      flyingBehavior.start();
      smokeTrail.setEnabled(true);
      logger.info('Flying behavior and smoke trail started for Cessna');
    }, animationDurationMs + 3000);

    logger.info('Cessna loaded successfully with flying behavior and smoke trail');

    return { mesh, flyingBehavior, smokeTrail };
  } catch (error) {
    errorHandler(error as Error, 'loading Cessna');
    return null;
  }
}

/**
 * Loads a Hercules aircraft with flying behavior
 */
export async function loadHercules(
  scene: THREE.Scene,
  config: HerculesConfig,
  animationDurationMs: number,
  errorHandler: (error: Error, context: string) => void
): Promise<VehicleLoadResult | null> {
  try {
    const hercules = new Hercules({
      scale: config.scale,
      bodyColor: config.bodyColor,
      wingColor: config.wingColor,
      propellerColor: config.propellerColor,
      windowColor: config.windowColor,
    });

    const mesh = await hercules.load();
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
      debugVectors: DEBUG_VECTORS,
      waypoints: config.waypoints,
      waypointTension: config.waypointTension,
      waypointLoop: config.waypointLoop,
    });

    flyingBehavior.attachTo(mesh);

    const smokeTrail = new SmokeTrail({
      emissionRate: 6,
      particleLifetime: 6,
      initialSize: 1.5,
      finalSize: 7,
      color: new THREE.Color(0xcccccc),
      maxParticles: 120,
      turbulence: 0.8,
      enabled: false,
    });
    scene.add(smokeTrail.getGroup());

    setTimeout(() => {
      flyingBehavior.start();
      smokeTrail.setEnabled(true);
      logger.info('Flying behavior and smoke trail started for Hercules');
    }, animationDurationMs + 4000);

    logger.info('Hercules loaded successfully with flying behavior and smoke trail');

    return { mesh, flyingBehavior, smokeTrail };
  } catch (error) {
    errorHandler(error as Error, 'loading Hercules');
    return null;
  }
}
