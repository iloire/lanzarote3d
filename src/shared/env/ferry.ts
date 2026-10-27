import * as THREE from 'three';
import { createFerry } from '../../foundation/components/scenery/boats/Ferry';
import { addBoatWake } from '../../foundation/components/effects/BoatWake';
import { sharedUniforms } from '../../foundation/rendering/sharedUniforms';

/**
 * The Órzola – Caleta de Sebo ferry across El Río, back and forth all day. The route is in world
 * units, traced on the model's own coast (its harbours and the open water round Punta Fariones),
 * because a projected OpenStreetMap line would cut across the model's headland.
 */
export const FERRY = {
  /** Órzola harbour to Caleta de Sebo: out north round Punta Fariones, then west across El Río */
  route: [
    [15700, -12550],
    [15800, -12900],
    [15400, -13300],
    [14900, -13550],
    [14300, -14000],
    [13450, -13850],
    [12600, -13600],
    [11800, -13250],
    [11600, -13200],
  ] as [number, number][],
  /** World units a second under way: about 1 km a minute, far quicker than the real crossing */
  speed: 20,
  /** Seconds alongside at each end before setting off again */
  dwell: 40,
  /** Drawn as big as the other boats */
  scale: 2.5,
};

/**
 * Where a ferry plying back and forth is at time `t`: `u` from 0 (the first harbour) to 1 (the
 * other) and whether it is heading out. Each leg takes `travel` seconds, easing away from the
 * quay and in to the next, then it waits `dwell` seconds before turning back.
 */
export function crossing(
  t: number,
  travel: number,
  dwell: number
): { u: number; outbound: boolean } {
  const leg = travel + dwell;
  const phase = ((t % (2 * leg)) + 2 * leg) % (2 * leg);
  const outbound = phase < leg;
  const s = Math.min((outbound ? phase : phase - leg) / travel, 1);
  const eased = s * s * (3 - 2 * s);
  return { u: outbound ? eased : 1 - eased, outbound };
}

/**
 * The ferry, with its wake, moving itself along the route on the shared clock every frame it
 * is drawn. Its place is worked out from the time alone, so frames it is off screen cost nothing.
 */
export const createFerryCrossing = (): THREE.Object3D => {
  const curve = new THREE.CatmullRomCurve3(
    FERRY.route.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    'catmullrom',
    0.5
  );
  const travel = curve.getLength() / FERRY.speed;

  const boat = new THREE.Group();
  boat.name = 'Órzola – La Graciosa ferry';
  const hull = createFerry();
  boat.add(hull);
  const wake = addBoatWake(boat);
  boat.scale.setScalar(FERRY.scale);

  const tangent = new THREE.Vector3();
  const update = () => {
    const t = sharedUniforms.uTime.value;
    const { u, outbound } = crossing(t, travel, FERRY.dwell);
    curve.getPointAt(u, boat.position);
    curve.getTangentAt(u, tangent);
    if (!outbound) tangent.negate();
    // Bow along −z: point it down the route, with a slow roll and pitch in the swell
    boat.rotation.set(
      Math.sin(t * 0.9) * 0.02,
      Math.atan2(-tangent.x, -tangent.z),
      Math.sin(t * 0.7) * 0.03
    );
    // No wake while it lies alongside
    wake.visible = u > 0.005 && u < 0.995;
  };
  update();
  hull.onBeforeRender = update;
  return boat;
};
