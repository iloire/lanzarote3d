import * as THREE from 'three';

/** A crossing a ferry makes back and forth, in world x, z */
export interface FerryRoute {
  from: [number, number];
  to: [number, number];
  /** Ferries on it, spread over the timetable */
  count: number;
}

/** A closed loop a boat cruises, in world x, z */
export interface CruiseRoute {
  kind: 'junk' | 'launch';
  route: [number, number][];
  /** Metres a second */
  speed: number;
}

export interface HarbourSettings {
  ferries: FerryRoute[];
  cruises: CruiseRoute[];
  unitsPerMetre: number;
  /** World height of the water */
  waterY: number;
}

/** One box of a boat, metres: width, height, length, centre (x, y, z), colour, light */
type Part = [number, number, number, number, number, number, string, number];

const WINDOWS = '#ffd49a';
// The Star Ferry: green hull and lower deck, white upper deck, both decks' windows lit
const FERRY: Part[] = [
  [9, 2.4, 40, 0, 1.2, 0, '#1d4d33', 0],
  [8.2, 2.6, 32, 0, 3.7, 0, '#2f7a4d', 0],
  [8.3, 0.9, 29, 0, 3.9, 0, WINDOWS, 3],
  [7.8, 2.3, 27, 0, 6.15, 0, '#e9e6dc', 0],
  [7.9, 0.8, 24, 0, 6.3, 0, WINDOWS, 3.2],
  [8.6, 0.3, 30, 0, 7.45, 0, '#f2f0ea', 0],
  [0.6, 0.6, 0.6, 0, 8.6, 0, '#ffffff', 8],
  [9.1, 0.25, 40.5, 0, 2.45, 0, '#f2f0ea', 0],
];
// A junk under red sails lit from the deck, like the Aqua Luna
const JUNK: Part[] = [
  [7, 2.6, 28, 0, 1.3, 0, '#3a2414', 0],
  [5.2, 2, 12, 0, 3.6, -2, '#5a3a22', 0],
  [5.3, 0.7, 10, 0, 3.8, -2, WINDOWS, 2.5],
  [0.25, 15, 9, 0, 11.5, 6, '#ff3b2a', 1.4],
  [0.25, 18, 11, 0, 13, -2, '#ff3b2a', 1.4],
  [0.25, 11, 7, 0, 9.5, -10, '#ff3b2a', 1.4],
  [7.1, 0.25, 28.5, 0, 2.7, 0, '#ffcf80', 2],
];
// A harbour launch: a white hull, a lit cabin, a masthead light and red and green side lights
const LAUNCH: Part[] = [
  [4.2, 1.6, 15, 0, 0.8, 0, '#e8e8e4', 0],
  [3.4, 2, 6, 0, 2.6, -1, '#f4f4f0', 0],
  [3.5, 0.7, 5, 0, 2.8, -1, WINDOWS, 3],
  [0.4, 0.4, 0.4, 0, 5.2, 0, '#ffffff', 9],
  [0.35, 0.35, 0.35, -2.2, 1.9, 2, '#ff1a1a', 7],
  [0.35, 0.35, 0.35, 2.2, 1.9, 2, '#1aff4a', 7],
];

/** A boat's boxes merged, coloured per vertex, the lit ones glowing (`emit`), a metre a unit */
function boatGeometry(parts: Part[]): THREE.BufferGeometry {
  const boxes = parts.map(([w, h, l, x, y, z]) =>
    new THREE.BoxGeometry(w, h, l).translate(x, y, z).toNonIndexed()
  );
  const perVertex = (values: (part: Part) => number[]) =>
    new THREE.BufferAttribute(
      new Float32Array(
        parts.flatMap((part, i) =>
          Array.from({ length: boxes[i]!.attributes['position']!.count }, () => values(part)).flat()
        )
      ),
      3
    );
  const merged = (name: string) =>
    new THREE.BufferAttribute(
      new Float32Array(boxes.flatMap(box => Array.from(box.attributes[name]!.array))),
      3
    );
  const colour = new THREE.Color();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', merged('position'));
  geometry.setAttribute('normal', merged('normal'));
  geometry.setAttribute(
    'color',
    perVertex(part => colour.set(part[6]).toArray() as number[])
  );
  geometry.setAttribute(
    'emit',
    perVertex(part => colour.set(part[6]).multiplyScalar(part[7]).toArray() as number[])
  );
  boxes.forEach(box => box.dispose());
  return geometry;
}

function boatMaterial(): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 emit;\nvarying vec3 vEmit;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEmit = emit;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEmit;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vEmit;'
      );
  };
  material.customProgramCacheKey = () => 'harbour-boat';
  return material;
}

/** Seconds a ferry takes to cross, and waits at each pier */
const CROSSING = 150;
const AT_PIER = 25;

interface Boat {
  mesh: THREE.Mesh;
  /** Where the boat is at time t, and the way it faces, into the vectors */
  move: (t: number, at: THREE.Vector3, facing: THREE.Vector3) => void;
  phase: number;
}

/**
 * The harbour's boats at night: Star Ferries crossing back and forth between their piers (they
 * are double-ended and never turn), junks under lit red sails and launches cruising loops, all
 * rocking a little on the swell.
 */
export class HarbourBoats {
  readonly group = new THREE.Group();
  private readonly boats: Boat[] = [];
  private time = 0;
  private readonly at = new THREE.Vector3();
  private readonly facing = new THREE.Vector3();
  private readonly material = boatMaterial();

  constructor(private readonly settings: HarbourSettings) {
    this.group.name = 'harbour-boats';
    const kinds = {
      ferry: boatGeometry(FERRY),
      junk: boatGeometry(JUNK),
      launch: boatGeometry(LAUNCH),
    };
    settings.ferries.forEach(({ from, to, count }) => {
      const a = new THREE.Vector3(from[0], 0, from[1]);
      const b = new THREE.Vector3(to[0], 0, to[1]);
      const cycle = 2 * (CROSSING + AT_PIER);
      for (let k = 0; k < count; k++) {
        this.add(kinds.ferry, k * (cycle / count), (t, at, facing) => {
          const s = t % cycle;
          const leg = s < cycle / 2 ? s : s - cycle / 2;
          const going = s < cycle / 2;
          const eased = THREE.MathUtils.smootherstep(Math.max(0, leg - AT_PIER) / CROSSING, 0, 1);
          at.lerpVectors(going ? a : b, going ? b : a, eased);
          facing.subVectors(b, a);
        });
      }
    });
    settings.cruises.forEach(({ kind, route, speed }, n) => {
      const points = route.map(([x, z]) => new THREE.Vector3(x, 0, z));
      const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
      const period = curve.getLength() / (speed * settings.unitsPerMetre);
      this.add(kinds[kind], n * 17, (t, at, facing) => {
        const u = (t / period) % 1;
        curve.getPointAt(u, at);
        curve.getTangentAt(u, facing);
      });
    });
  }

  private add(geometry: THREE.BufferGeometry, phase: number, move: Boat['move']): void {
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.scale.setScalar(this.settings.unitsPerMetre);
    mesh.castShadow = true;
    this.group.add(mesh);
    this.boats.push({ mesh, move, phase });
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.boats.forEach(({ mesh, move, phase }, i) => {
      move(this.time + phase, this.at, this.facing);
      mesh.position.set(this.at.x, this.settings.waterY, this.at.z);
      mesh.rotation.set(
        Math.sin(this.time * 0.9 + i) * 0.015,
        Math.atan2(this.facing.x, this.facing.z),
        Math.sin(this.time * 0.7 + i * 2.1) * 0.02,
        'YXZ'
      );
    });
  }

  dispose(): void {
    const geometries = new Set(this.boats.map(({ mesh }) => mesh.geometry));
    geometries.forEach(geometry => geometry.dispose());
    this.material.dispose();
  }
}
