import * as THREE from 'three';

/**
 * A road as 3d/city-on-hills.py writes it: its lanes (positive, that many one way; negative,
 * that many each way) and then world x, y, z of each point along it
 */
export type Road = number[];

export interface RoadTrafficSettings {
  unitsPerMetre: number;
  /** The most cars, all roads together */
  maxCars: number;
  /** Metres between cars in a lane, at the least */
  spacing: number;
  /** Metres a second, slowest and fastest lane */
  speed: [number, number];
  /** Metres between lanes */
  laneWidth: number;
  /** Drive on the left (Hong Kong) or the right */
  keepLeft: boolean;
}

/** Dark bodies at night, taxis red and buses, er, also red (sRGB) */
const BODIES = ['#1b1d21', '#2a2d33', '#8a1c1c', '#d8d8d4', '#3a3f4a', '#a01818'];
const HEADLIGHT = new THREE.Color(1.0, 0.9, 0.75).multiplyScalar(7);
const TAIL_LIGHT = new THREE.Color(1.0, 0.05, 0.03).multiplyScalar(5);

/**
 * A car a metre to the unit, its length along +z (forward): a body, two headlights at the front
 * and two tail lights at the back, the lamps bigger than life so they read from the air. The
 * lamps carry their light in `emit`.
 */
export function carWithLights(): THREE.BufferGeometry {
  // Width, height, length, then where its centre is: up, forward, sideways; and its light
  const parts: [number, number, number, number, number, number, THREE.Color | null][] = [
    [1.9, 1.3, 4.6, 0.85, 0, 0, null],
    [0.55, 0.4, 0.3, 0.75, 2.35, 0.75, HEADLIGHT],
    [0.55, 0.4, 0.3, 0.75, 2.35, -0.75, HEADLIGHT],
    [0.5, 0.35, 0.3, 0.85, -2.35, 0.75, TAIL_LIGHT],
    [0.5, 0.35, 0.3, 0.85, -2.35, -0.75, TAIL_LIGHT],
  ];
  const boxes = parts.map(([w, h, l, y, z, x]) =>
    new THREE.BoxGeometry(w, h, l).translate(x, y, z).toNonIndexed()
  );
  const merged = (name: string) =>
    new THREE.BufferAttribute(
      new Float32Array(boxes.flatMap(box => Array.from(box.attributes[name]!.array))),
      3
    );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', merged('position'));
  geometry.setAttribute('normal', merged('normal'));
  geometry.setAttribute(
    'emit',
    new THREE.BufferAttribute(
      new Float32Array(
        parts.flatMap(([, , , , , , light], i) => {
          const rgb = light ? [light.r, light.g, light.b] : [0, 0, 0];
          return Array.from({ length: boxes[i]!.attributes['position']!.count }, () => rgb).flat();
        })
      ),
      3
    )
  );
  boxes.forEach(box => box.dispose());
  return geometry;
}

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface Lane {
  points: THREE.Vector3[];
  /** Distance from the start to each point */
  at: number[];
  length: number;
  /** World units sideways from the road's middle, to the left of its direction */
  offset: number;
  forward: boolean;
  speed: number;
}

/**
 * Cars on roads that climb and fall with the ground, in one instanced mesh, with their lights
 * on: rivers of white coming and red going. Every car in a lane goes at that lane's speed, and
 * at the lane's end comes round to its start.
 */
export class RoadTraffic {
  readonly mesh: THREE.InstancedMesh;
  private readonly lanes: Lane[] = [];
  private readonly cars: { lane: number; at: number }[] = [];
  private readonly matrix = new THREE.Matrix4();
  private readonly position = new THREE.Vector3();
  private readonly ahead = new THREE.Vector3();
  private readonly turn = new THREE.Quaternion();
  private readonly look = new THREE.Matrix4();
  private readonly scale: THREE.Vector3;
  private readonly up = new THREE.Vector3(0, 1, 0);

  constructor(roads: Road[], settings: RoadTrafficSettings) {
    const upm = settings.unitsPerMetre;
    roads.forEach((road, r) => {
      const lanes = Math.abs(road[0]!);
      const points: THREE.Vector3[] = [];
      for (let k = 1; k + 2 < road.length; k += 3) {
        points.push(new THREE.Vector3(road[k], road[k + 1], road[k + 2]));
      }
      const at = [0];
      for (let k = 1; k < points.length; k++) {
        at.push(at[k - 1]! + points[k]!.distanceTo(points[k - 1]!));
      }
      const length = at[at.length - 1]!;
      if (length < settings.spacing * upm) return;
      const directions = road[0]! > 0 ? [true] : [true, false];
      directions.forEach(forward => {
        for (let k = 0; k < lanes; k++) {
          // One way, the lanes straddle the middle; two way, each side keeps to its own half
          const across = road[0]! > 0 ? k - (lanes - 1) / 2 : k + 0.5;
          const side = (settings.keepLeft ? 1 : -1) * (forward ? 1 : -1);
          this.lanes.push({
            points,
            at,
            length,
            offset: across * side * settings.laneWidth * upm,
            forward,
            speed:
              (settings.speed[0] + (settings.speed[1] - settings.speed[0]) * hash(r + k * 0.37)) *
              upm,
          });
        }
      });
    });
    const total = this.lanes.reduce((sum, lane) => sum + lane.length, 0);
    const gap = Math.max(settings.spacing * upm, total / settings.maxCars);
    this.lanes.forEach((lane, i) => {
      for (let at = hash(i + 0.5) * gap; at < lane.length; at += gap * (0.6 + 0.8 * hash(at + i))) {
        this.cars.push({ lane: i, at });
      }
    });

    const material = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3 });
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute vec3 emit;\nvarying vec3 vEmit;'
        )
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEmit = emit;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vEmit;')
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vEmit;'
        );
    };
    material.customProgramCacheKey = () => 'road-traffic';
    this.mesh = new THREE.InstancedMesh(carWithLights(), material, this.cars.length);
    this.mesh.name = 'road-traffic';
    this.scale = new THREE.Vector3(upm, upm, upm);
    const colour = new THREE.Color();
    this.cars.forEach((_, i) => {
      this.mesh.setColorAt(i, colour.set(BODIES[Math.floor(hash(i * 7.7) * BODIES.length)]!));
    });
    this.mesh.frustumCulled = false;
    this.update(0);
  }

  get count(): number {
    return this.cars.length;
  }

  /** Where along a lane `at` lands, sideways to its lane, into `out` */
  private place(lane: Lane, at: number, out: THREE.Vector3): THREE.Vector3 {
    const along = lane.forward ? at : lane.length - at;
    let k = 1;
    while (k < lane.at.length - 1 && lane.at[k]! < along) k++;
    const a = lane.points[k - 1]!;
    const b = lane.points[k]!;
    const span = lane.at[k]! - lane.at[k - 1]! || 1;
    out.lerpVectors(a, b, THREE.MathUtils.clamp((along - lane.at[k - 1]!) / span, 0, 1));
    // To the left of the road's own direction (x east, z south: left of (dx, dz) is (dz, -dx))
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    out.x += (dz / len) * lane.offset;
    out.z += (-dx / len) * lane.offset;
    return out;
  }

  /** Drives every car on by `deltaTime` seconds */
  update(deltaTime: number): void {
    this.cars.forEach((car, i) => {
      const lane = this.lanes[car.lane]!;
      car.at = (car.at + lane.speed * deltaTime) % lane.length;
      this.place(lane, car.at, this.position);
      this.place(lane, Math.min(car.at + 2, lane.length), this.ahead);
      if (this.ahead.distanceToSquared(this.position) < 1e-6) {
        this.place(lane, Math.max(car.at - 2, 0), this.ahead);
        this.ahead.sub(this.position).negate().add(this.position);
      }
      // Face along the lane (+z towards what's ahead), nose up or down the hill
      this.look.lookAt(this.ahead, this.position, this.up);
      this.turn.setFromRotationMatrix(this.look);
      this.matrix.compose(this.position, this.turn, this.scale);
      this.mesh.setMatrixAt(i, this.matrix);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
