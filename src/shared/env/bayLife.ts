import * as THREE from 'three';

/** Boxes in metres: width (x), height, depth (z, forwards), centre, and an sRGB colour */
type Part = [number, number, number, [number, number, number], string];

/** Things on the bay are drawn this many times life size, so a flock reads from a kilometre off */
const LIFE_SCALE = 2;

// A salt meadow sheep, facing +z: fleece, black face and legs
const SHEEP: Part[] = [
  [0.62, 0.55, 1.05, [0, 0.72, 0], '#ece6d6'],
  [0.3, 0.32, 0.34, [0, 0.86, 0.62], '#232020'],
  [0.5, 0.42, 0.75, [0, 0.25, 0], '#2d2a27'],
];
// A walker, facing +z: legs, jacket (tinted per walker), head
const WALKER: Part[] = [
  [0.36, 0.85, 0.24, [0, 0.43, 0], '#3a3d44'],
  [0.46, 0.66, 0.3, [0, 1.17, 0], '#ffffff'],
  [0.22, 0.24, 0.22, [0, 1.63, 0], '#d9a786'],
  [0.34, 0.42, 0.18, [0, 1.22, -0.22], '#55606e'],
];
const JACKETS = ['#d8432e', '#f2b02a', '#2f7fc1', '#3d9a54', '#e8e1d0', '#c4357a', '#f07c22'];
const WALK_SPEED = 1.4; // metres a second
const WALKER_GAP = 4; // metres between walkers, give or take
// A walker steps off the sand this deep before the water reaches them, metres
const WADE = 0.15;

function partsGeometry(parts: Part[]): THREE.BufferGeometry {
  const boxes = parts.map(([w, h, d, [x, y, z]]) =>
    new THREE.BoxGeometry(w, h, d).translate(x, y, z).toNonIndexed()
  );
  const geometry = new THREE.BufferGeometry();
  const merged = (name: string) =>
    new THREE.BufferAttribute(
      new Float32Array(boxes.flatMap(box => Array.from(box.attributes[name]!.array))),
      3
    );
  geometry.setAttribute('position', merged('position'));
  geometry.setAttribute('normal', merged('normal'));
  const colour = new THREE.Color();
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(
      new Float32Array(
        boxes.flatMap((box, i) => {
          colour.set(parts[i]![4]);
          return Array(box.attributes['position']!.count)
            .fill(0)
            .flatMap(() => [colour.r, colour.g, colour.b]);
        })
      ),
      3
    )
  );
  boxes.forEach(box => box.dispose());
  return geometry;
}

/** Deterministic 0-1 per number */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Flocks of sheep on the salt meadows, one instanced mesh: [x, y, z, seed] per sheep in world
 * units, as 3d/mont-saint-michel-to-glb.py writes them. Each turned its own way and a little
 * bigger or smaller.
 */
export function bayFlocks(spots: number[], unitsPerMetre: number): THREE.InstancedMesh {
  const count = Math.floor(spots.length / 4);
  const mesh = new THREE.InstancedMesh(
    partsGeometry(SHEEP),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
    count
  );
  const matrix = new THREE.Matrix4();
  const turn = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const at = new THREE.Vector3();
  const size = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const seed = spots[i * 4 + 3]!;
    at.set(spots[i * 4]!, spots[i * 4 + 1]!, spots[i * 4 + 2]!);
    turn.setFromAxisAngle(up, seed * Math.PI * 2);
    size.setScalar(unitsPerMetre * LIFE_SCALE * (0.85 + 0.3 * hash(i)));
    mesh.setMatrixAt(i, matrix.compose(at, turn, size));
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'sheep';
  return mesh;
}

/**
 * A guided group walking out across the sand on a path ([x, y, z, ...] world units, the ground
 * under it), strung out in a loose line. Each walker is there only while the sand under them is
 * dry: the flood sends them off the flats and the ebb brings them back.
 */
export class BayWalkers {
  readonly mesh: THREE.InstancedMesh;
  private readonly points: THREE.Vector3[] = [];
  private readonly lengths: number[] = [0];
  private travelled = 0;
  private readonly matrix = new THREE.Matrix4();
  private readonly turn = new THREE.Quaternion();
  private readonly at = new THREE.Vector3();
  private readonly ahead = new THREE.Vector3();
  private readonly size = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);

  constructor(
    path: number[],
    count: number,
    private readonly unitsPerMetre: number
  ) {
    for (let i = 0; i + 2 < path.length; i += 3) {
      this.points.push(new THREE.Vector3(path[i], path[i + 1], path[i + 2]));
      if (this.points.length > 1) {
        const n = this.points.length;
        this.lengths.push(
          this.lengths[n - 2]! + this.points[n - 1]!.distanceTo(this.points[n - 2]!)
        );
      }
    }
    this.mesh = new THREE.InstancedMesh(
      partsGeometry(WALKER),
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }),
      count
    );
    const jacket = new THREE.Color();
    for (let i = 0; i < count; i++) {
      jacket.set(JACKETS[Math.floor(hash(i + 0.5) * JACKETS.length)]!);
      this.mesh.setColorAt(i, jacket);
    }
    this.mesh.castShadow = true;
    this.mesh.name = 'walkers';
    // Spread along the first part of the path from the start
    this.travelled = count * WALKER_GAP * unitsPerMetre;
  }

  private get total(): number {
    return this.lengths[this.lengths.length - 1]!;
  }

  /** The point `distance` along the path, wrapping round */
  private pointAt(distance: number, out: THREE.Vector3): THREE.Vector3 {
    const total = this.total;
    const d = ((distance % total) + total) % total;
    let k = 1;
    while (k < this.lengths.length - 1 && this.lengths[k]! < d) k++;
    const from = this.lengths[k - 1]!;
    const span = this.lengths[k]! - from || 1;
    return out.lerpVectors(this.points[k - 1]!, this.points[k]!, (d - from) / span);
  }

  /** Walk on; `waterY` is the tide's world height, so walkers under it are hidden */
  update(deltaTime: number, waterY: number): void {
    if (this.points.length < 2) return;
    const upm = this.unitsPerMetre;
    this.travelled += WALK_SPEED * upm * deltaTime;
    for (let i = 0; i < this.mesh.count; i++) {
      const behind = (i * WALKER_GAP + hash(i) * 2.5) * upm;
      const distance = this.travelled - behind;
      this.pointAt(distance, this.at);
      this.pointAt(distance + upm, this.ahead);
      // A loose line: each walker a little to one side, swaying as they go
      const side = (hash(i + 7) - 0.5) * 5 * upm + Math.sin(distance / (40 * upm) + i) * upm;
      const dx = this.ahead.x - this.at.x;
      const dz = this.ahead.z - this.at.z;
      const len = Math.hypot(dx, dz) || 1;
      this.at.x += (-dz / len) * side;
      this.at.z += (dx / len) * side;
      const dry = THREE.MathUtils.clamp((this.at.y - waterY) / (WADE * upm * 2) - 0.5, 0, 1);
      this.turn.setFromAxisAngle(this.up, Math.atan2(dx, dz));
      this.size.setScalar(upm * LIFE_SCALE * dry);
      this.at.y += Math.abs(Math.sin(distance / (0.7 * upm))) * 0.05 * upm;
      this.mesh.setMatrixAt(i, this.matrix.compose(this.at, this.turn, this.size));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
