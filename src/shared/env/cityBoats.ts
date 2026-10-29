import * as THREE from 'three';

/**
 * A canal boats follow, as 3d/city-to-glb.py writes them for a city on the water: the water's
 * width in metres, its name, and its centreline clipped to the water, world x, z flat
 */
export interface Canal {
  width: number;
  name: string;
  points: number[];
}

export interface BoatSettings {
  /** World units per metre */
  unitsPerMetre: number;
  /** World height of the water */
  water: number;
}

type BoatKind = 'gondola' | 'vaporetto' | 'taxi' | 'barge';

/** A box in metres: width (x), height (y), length (z), centre x, y, z, and its colour (sRGB) */
type Part = [number, number, number, number, number, number, string];

const BLACK = '#101112';

/** A gondola's hull, rising at both ends, its ferro, the seats and the gondolier on the stern */
function gondolaParts(): Part[] {
  const parts: Part[] = [];
  const segments = 9;
  for (let i = 0; i < segments; i++) {
    const z = -5.25 + (i + 0.5) * (10.5 / segments);
    const t = Math.abs(z) / 5.6;
    parts.push([
      1.45 * (1 - t * t * 0.7),
      0.5,
      10.5 / segments + 0.05,
      0,
      0.3 + 0.7 * t ** 3,
      z,
      BLACK,
    ]);
  }
  parts.push(
    // The ferro on the bow, and the forcola on the stern
    [0.12, 1.0, 0.5, 0, 1.4, 5.4, '#c9ccd1'],
    [0.15, 0.8, 0.2, 0.4, 1.0, -3.6, '#5a3a22'],
    // Seats in red and gold
    [1.0, 0.25, 1.6, 0, 0.65, 0.6, '#8a1e22'],
    [0.9, 0.18, 0.8, 0, 0.62, 2.0, '#b8902f'],
    // The gondolier: dark trousers, striped shirt, straw boater, and his oar
    [0.4, 0.95, 0.3, 0, 1.05, -4.3, '#1d2433'],
    [0.5, 0.65, 0.34, 0, 1.85, -4.3, '#eef0f2'],
    [0.5, 0.12, 0.35, 0, 1.75, -4.3, '#1d3a6b'],
    [0.24, 0.26, 0.24, 0, 2.32, -4.3, '#c8946e'],
    [0.6, 0.07, 0.6, 0, 2.5, -4.3, '#e2c766'],
    [0.08, 0.08, 4.2, 0.45, 1.3, -2.9, '#6b4a2b']
  );
  return parts;
}

/** An ACTV waterbus: dark hull, white cabin with a band of windows, the wheelhouse forward */
function vaporettoParts(): Part[] {
  return [
    [4.4, 1.1, 23, 0, 0.35, 0, '#34413e'],
    [4.5, 0.2, 23.2, 0, 0.95, 0, '#121314'],
    [3.9, 1.9, 13, 0, 2.0, -2.5, '#ecebe5'],
    [3.95, 0.7, 12.2, 0, 2.15, -2.5, '#1b252b'],
    [4.1, 0.15, 13.6, 0, 3.0, -2.5, '#c9c8c2'],
    [2.2, 1.1, 2.6, 0, 3.6, 5.2, '#f2f1ec'],
    [2.25, 0.45, 2.3, 0, 3.7, 5.2, '#1b252b'],
    [4.3, 0.6, 5.0, 0, 1.3, 7.2, '#d8d4c8'],
  ];
}

/** A varnished mahogany water taxi with its white cabin aft of the bow deck */
function taxiParts(): Part[] {
  return [
    [2.5, 0.9, 10, 0, 0.35, 0, '#7a3e1f'],
    [2.2, 0.15, 3.6, 0, 0.85, 3.0, '#9a5a30'],
    [2.2, 1.2, 4.2, 0, 1.4, -0.6, '#f0eee8'],
    [2.25, 0.5, 3.4, 0, 1.55, -0.4, '#1b252b'],
    [2.0, 0.3, 2.2, 0, 0.9, -3.6, '#9a5a30'],
  ];
}

/** A cargo topo: white hull, wheelhouse aft and crates in the hold */
function bargeParts(): Part[] {
  return [
    [3.1, 1.0, 12, 0, 0.35, 0, '#d9d4c8'],
    [3.15, 0.18, 12.1, 0, 0.82, 0, '#2f5d8a'],
    [1.6, 1.6, 1.8, 0, 1.6, -4.4, '#f0eee8'],
    [1.65, 0.5, 1.5, 0, 1.9, -4.4, '#1b252b'],
    [2.4, 1.0, 2.6, 0, 1.3, -0.8, '#b5873f'],
    [2.4, 0.8, 2.4, 0, 1.2, 2.0, '#8e9a86'],
    [2.0, 1.2, 1.6, 0, 1.4, 4.2, '#c9c3b4'],
  ];
}

const KINDS: Record<
  BoatKind,
  { parts: () => Part[]; length: number; speed: number; spacing: number }
> = {
  gondola: { parts: gondolaParts, length: 11, speed: 1.4, spacing: 140 },
  vaporetto: { parts: vaporettoParts, length: 23, speed: 4.5, spacing: 650 },
  taxi: { parts: taxiParts, length: 10, speed: 7, spacing: 420 },
  barge: { parts: bargeParts, length: 12, speed: 3, spacing: 700 },
};

/** Canals at least this wide, metres, carry the waterbuses, taxis and barges */
const WIDE = 25;
/** The most boats of each kind, all canals together */
const MOST = 700;
/** Wake length behind a boat, in boat lengths, and its width at the far end, in wake lengths */
const WAKE_LENGTH = 1.8;
const WAKE_SPREAD = 0.4;

/** One geometry of a metre to the unit, the parts' triangles end to end, coloured per vertex */
function boatGeometry(parts: Part[]): THREE.BufferGeometry {
  const boxes = parts.map(([w, h, l, x, y, z]) =>
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
  const colour = new THREE.Color();
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(
      new Float32Array(
        boxes.flatMap((box, i) => {
          colour.set(parts[i]![6]);
          return Array.from({ length: box.attributes['position']!.count }, () => [
            colour.r,
            colour.g,
            colour.b,
          ]).flat();
        })
      ),
      3
    )
  );
  boxes.forEach(box => box.dispose());
  return geometry;
}

/** A V of foam spreading behind the stern and a churned strip down its middle, fading aft */
function wakeTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const fade = (1 - t) ** 2.2;
    const spread = 0.06 + 0.4 * t;
    // Soft-edged arms: a gradient across each, wider and fainter as they spread
    for (const side of [-1, 1]) {
      const x = size / 2 + side * spread * size;
      const half = 2 + 7 * t;
      const arm = g.createLinearGradient(x - half, 0, x + half, 0);
      arm.addColorStop(0, 'rgba(255,255,255,0)');
      arm.addColorStop(0.5, `rgba(255,255,255,${0.75 * fade})`);
      arm.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = arm;
      g.fillRect(x - half, y, half * 2, 1);
    }
    const half = 4 + 10 * t;
    const churn = g.createLinearGradient(size / 2 - half, 0, size / 2 + half, 0);
    churn.addColorStop(0, 'rgba(255,255,255,0)');
    churn.addColorStop(0.5, `rgba(255,255,255,${0.6 * fade})`);
    churn.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = churn;
    g.fillRect(size / 2 - half, y, half * 2, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  // The canvas's top row, the V's point, at the stern
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Deterministic 0-1 per number, so the boats are the same on every load */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** A closed route: up one side of a canal and back down the other, as points and running lengths */
interface Route {
  points: THREE.Vector2[];
  lengths: number[];
  total: number;
}

function route(canal: Canal, offset: number): Route | undefined {
  const line: THREE.Vector2[] = [];
  for (let i = 0; i + 1 < canal.points.length; i += 2) {
    line.push(new THREE.Vector2(canal.points[i], canal.points[i + 1]));
  }
  if (line.length < 2) return undefined;
  // Each side keeps to its right of the centreline
  const side = (points: THREE.Vector2[]) =>
    points.map((p, i) => {
      const a = points[Math.max(i - 1, 0)]!;
      const b = points[Math.min(i + 1, points.length - 1)]!;
      const along = b.clone().sub(a).normalize();
      return p.clone().add(new THREE.Vector2(-along.y, along.x).multiplyScalar(offset));
    });
  const points = [...side(line), ...side([...line].reverse())];
  const lengths = [0];
  for (let i = 1; i <= points.length; i++) {
    lengths.push(lengths[i - 1]! + points[i % points.length]!.distanceTo(points[i - 1]!));
  }
  return { points, lengths, total: lengths[points.length]! };
}

/** The point `s` along a route, into `out` */
function pointAt(r: Route, s: number, out: THREE.Vector2): THREE.Vector2 {
  const at = ((s % r.total) + r.total) % r.total;
  let lo = 0;
  let hi = r.points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (r.lengths[mid]! <= at) lo = mid;
    else hi = mid - 1;
  }
  const a = r.points[lo]!;
  const b = r.points[(lo + 1) % r.points.length]!;
  const span = r.lengths[lo + 1]! - r.lengths[lo]!;
  return out.copy(a).lerp(b, span > 0 ? (at - r.lengths[lo]!) / span : 0);
}

interface Boat {
  kind: BoatKind;
  index: number;
  route: Route;
  at: number;
  speed: number;
}

/**
 * Boats on a city's canals, every kind in one instanced mesh and every wake in another: black
 * gondolas glide the narrow rii and along the edges of the wide canals, where waterbuses, water
 * taxis and cargo barges run up one side and back down the other. Each boat turns smoothly by
 * aiming along its own length, and leaves a fading V of foam. A relax scene, not a timetable.
 */
export class CityBoats {
  readonly group = new THREE.Group();
  private readonly boats: Boat[] = [];
  private readonly meshes: Record<BoatKind, THREE.InstancedMesh>;
  private readonly wakes: THREE.InstancedMesh;
  private readonly matrix = new THREE.Matrix4();
  private readonly position = new THREE.Vector3();
  private readonly turn = new THREE.Quaternion();
  private readonly scale: THREE.Vector3;
  private readonly wakeScale = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly ahead = new THREE.Vector2();
  private readonly behind = new THREE.Vector2();
  private readonly middle = new THREE.Vector2();

  constructor(
    canals: Canal[],
    private readonly settings: BoatSettings
  ) {
    const upm = settings.unitsPerMetre;
    const counts: Record<BoatKind, number> = { gondola: 0, vaporetto: 0, taxi: 0, barge: 0 };
    const add = (kind: BoatKind, r: Route | undefined, seed: number) => {
      if (!r) return;
      const { spacing, speed } = KINDS[kind];
      const gap = spacing * upm;
      for (
        let at = hash(seed) * gap;
        at < r.total && counts[kind] < MOST;
        at += gap * (0.5 + hash(at + seed))
      ) {
        this.boats.push({
          kind,
          index: counts[kind]++,
          route: r,
          at,
          speed: speed * upm * (0.85 + 0.3 * hash(at * 1.3 + seed)),
        });
      }
    };
    canals.forEach((canal, i) => {
      if (canal.width >= WIDE) {
        const lane = route(canal, canal.width * 0.22 * upm);
        add('vaporetto', lane, i + 0.1);
        add('taxi', lane, i + 0.2);
        add('barge', lane, i + 0.3);
        // Gondolas keep to the edges, out of the way
        add('gondola', route(canal, canal.width * 0.36 * upm), i + 0.4);
      } else {
        add('gondola', route(canal, 0), i + 0.5);
      }
    });

    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });
    const instanced = (kind: BoatKind) => {
      const mesh = new THREE.InstancedMesh(
        boatGeometry(KINDS[kind].parts()),
        material,
        Math.max(counts[kind], 1)
      );
      mesh.count = counts[kind];
      mesh.name = `city-boats-${kind}`;
      mesh.castShadow = true;
      // They spread over the whole city, so the mesh is never culled as a whole
      mesh.frustumCulled = false;
      this.group.add(mesh);
      return mesh;
    };
    this.meshes = {
      gondola: instanced('gondola'),
      vaporetto: instanced('vaporetto'),
      taxi: instanced('taxi'),
      barge: instanced('barge'),
    };

    // Wakes trail behind the stern, a little over the water, drawn after it
    const wake = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, -0.5);
    this.wakes = new THREE.InstancedMesh(
      wake,
      new THREE.MeshBasicMaterial({
        map: wakeTexture(),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
      Math.max(this.boats.length, 1)
    );
    this.wakes.count = this.boats.length;
    this.wakes.name = 'city-boat-wakes';
    this.wakes.frustumCulled = false;
    this.wakes.renderOrder = 1;
    this.group.add(this.wakes);
    this.scale = new THREE.Vector3(upm, upm, upm);
    this.update(0);
  }

  /** Moves every boat on by `deltaTime` seconds */
  update(deltaTime: number): void {
    const upm = this.settings.unitsPerMetre;
    this.boats.forEach((boat, i) => {
      boat.at = (boat.at + boat.speed * deltaTime) % boat.route.total;
      const { length } = KINDS[boat.kind];
      const half = (length * upm) / 2;
      // Aim along the boat's own length, so it rounds the bends instead of snapping at them
      pointAt(boat.route, boat.at + half, this.ahead);
      pointAt(boat.route, boat.at - half, this.behind);
      this.middle.addVectors(this.ahead, this.behind).multiplyScalar(0.5);
      const heading = Math.atan2(this.ahead.x - this.behind.x, this.ahead.y - this.behind.y);
      this.turn.setFromAxisAngle(this.up, heading);
      this.position.set(this.middle.x, this.settings.water, this.middle.y);
      this.matrix.compose(this.position, this.turn, this.scale);
      this.meshes[boat.kind].setMatrixAt(boat.index, this.matrix);

      const wakeLength = length * WAKE_LENGTH * upm;
      this.wakeScale.set(wakeLength * WAKE_SPREAD, 1, wakeLength);
      this.position.set(this.behind.x, this.settings.water + 0.05 * upm, this.behind.y);
      this.matrix.compose(this.position, this.turn, this.wakeScale);
      this.wakes.setMatrixAt(i, this.matrix);
    });
    Object.values(this.meshes).forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true;
    });
    this.wakes.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    Object.values(this.meshes).forEach(mesh => {
      mesh.geometry.dispose();
      mesh.dispose();
    });
    (Object.values(this.meshes)[0]?.material as THREE.Material | undefined)?.dispose();
    this.wakes.geometry.dispose();
    const wakeMaterial = this.wakes.material as THREE.MeshBasicMaterial;
    wakeMaterial.map?.dispose();
    wakeMaterial.dispose();
    this.wakes.dispose();
  }
}
