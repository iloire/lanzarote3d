import * as THREE from 'three';

/** A lane cars drive, as 3d/city-to-glb.py writes them: world x, z of its start and its end */
export type Lane = [number, number, number, number];

export interface TrafficSettings {
  /** World units per metre */
  unitsPerMetre: number;
  /** World height of the road */
  road: number;
  /** The most cars, all lanes together */
  maxCars: number;
  /** Metres between cars in a lane, at the least */
  spacing: number;
  /** Metres a second, slowest and fastest lane */
  speed: [number, number];
  /** Share of the cars that are yellow cabs, New York's unless given */
  taxiShare?: number;
}

/** Share of the cars that are yellow cabs, and the colours of the rest (sRGB) */
const TAXI_SHARE = 0.35;
const TAXI = '#f2b705';
const CAR_COLOURS = ['#f4f4f2', '#1d1f22', '#8a8f96', '#2c3e66', '#7a1f1f', '#c9ccd1', '#3a4a3a'];

/** A voxel car a metre to the unit: body, dark glasshouse and a roof */
function carGeometry(): THREE.BufferGeometry {
  const parts = [
    [1.9, 0.9, 4.6, 0.75, 0, 1],
    [1.7, 0.6, 2.4, 1.5, -0.2, 0.18],
    [1.72, 0.12, 2.0, 1.86, -0.2, 1],
  ].map(([w, h, l, y, z]) => new THREE.BoxGeometry(w, h, l).translate(0, y!, z!).toNonIndexed());
  // The boxes' triangles end to end, each shaded on its own (white takes the instance colour)
  const merged = (name: string) =>
    new THREE.BufferAttribute(
      new Float32Array(parts.flatMap(part => Array.from(part.attributes[name]!.array))),
      3
    );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', merged('position'));
  geometry.setAttribute('normal', merged('normal'));
  const shades = [1, 0.18, 1];
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(
      new Float32Array(
        parts.flatMap((part, i) => Array(part.attributes['position']!.count * 3).fill(shades[i]))
      ),
      3
    )
  );
  parts.forEach(part => part.dispose());
  return geometry;
}

/** Deterministic 0-1 per number, so the traffic is the same on every load */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Cars driving the city's lanes, every one in a single instanced mesh. All the cars in a lane go
 * at that lane's speed, so none drives through another; at the lane's end a car comes round to
 * its start. They ignore the junctions: it's a relax scene, not a simulation.
 */
export class CityTraffic {
  readonly mesh: THREE.InstancedMesh;
  private readonly cars: { lane: number; at: number }[] = [];
  private readonly lanes: {
    from: THREE.Vector2;
    along: THREE.Vector2;
    length: number;
    speed: number;
  }[];
  private readonly matrix = new THREE.Matrix4();
  private readonly position = new THREE.Vector3();
  private readonly turn = new THREE.Quaternion();
  private readonly scale: THREE.Vector3;
  private readonly up = new THREE.Vector3(0, 1, 0);

  constructor(
    lanes: Lane[],
    private readonly settings: TrafficSettings
  ) {
    const { unitsPerMetre: upm, speed } = settings;
    this.lanes = lanes.map(([x0, z0, x1, z1], i) => {
      const from = new THREE.Vector2(x0, z0);
      const along = new THREE.Vector2(x1 - x0, z1 - z0);
      const length = along.length();
      return {
        from,
        along: along.divideScalar(length || 1),
        length,
        speed: (speed[0] + (speed[1] - speed[0]) * hash(i)) * upm,
      };
    });
    const total = this.lanes.reduce((sum, lane) => sum + lane.length, 0);
    const gap = Math.max(settings.spacing * upm, total / settings.maxCars);
    this.lanes.forEach((lane, i) => {
      for (let at = hash(i + 0.5) * gap; at < lane.length; at += gap * (0.6 + 0.8 * hash(at + i))) {
        this.cars.push({ lane: i, at });
      }
    });

    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 });
    this.mesh = new THREE.InstancedMesh(carGeometry(), material, this.cars.length);
    this.mesh.name = 'city-traffic';
    this.scale = new THREE.Vector3(upm, upm, upm);
    const colour = new THREE.Color();
    this.cars.forEach((_, i) => {
      const taxi = hash(i * 3.3) < (settings.taxiShare ?? TAXI_SHARE);
      colour.set(taxi ? TAXI : CAR_COLOURS[Math.floor(hash(i * 7.7) * CAR_COLOURS.length)]!);
      this.mesh.setColorAt(i, colour);
    });
    // They spread over the whole city, so the mesh is never culled as a whole
    this.mesh.frustumCulled = false;
    this.update(0);
  }

  /** Drives every car on by `deltaTime` seconds */
  update(deltaTime: number): void {
    this.cars.forEach((car, i) => {
      const lane = this.lanes[car.lane]!;
      car.at = (car.at + lane.speed * deltaTime) % lane.length;
      this.position.set(
        lane.from.x + lane.along.x * car.at,
        this.settings.road,
        lane.from.y + lane.along.y * car.at
      );
      // The car's length runs along its local z
      this.turn.setFromAxisAngle(this.up, Math.atan2(lane.along.x, lane.along.y));
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
