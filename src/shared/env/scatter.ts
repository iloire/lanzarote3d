import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { rndBetween } from '../../foundation/utils/math';

export type ScatterKind = 'pine' | 'rock' | 'cardon' | 'broadleaf' | 'tower' | 'favela' | 'resort';

/** Where to scatter one kind of thing over the ground, in world units */
export interface ScatterArea {
  kind: ScatterKind;
  x: number;
  z: number;
  radius: number;
  count: number;
  /** Only on ground between these heights (world y); always above the sea */
  minHeight?: number;
  maxHeight?: number;
  /** Buildings line up with this heading (radians from +x), turned only by quarter turns */
  heading?: number;
}

// Ground lower than this is sea or the line of the surf
const SHORE = 3;
// Candidate points tried per thing placed, before giving up on an area that is mostly sea
const ATTEMPTS = 4;

/** A part of a template, coloured one flat colour */
const part = (geometry: THREE.BufferGeometry, color: string): THREE.BufferGeometry => {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const { count } = flat.getAttribute('position');
  const rgb = new THREE.Color(color);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) rgb.toArray(colors, i * 3);
  flat.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  flat.deleteAttribute('uv');
  return flat;
};

/** A Canary pine: a bare trunk and a tall, loose crown of three tiers, ~24 units high */
const pine = (): THREE.BufferGeometry => {
  const trunk = new THREE.CylinderGeometry(0.5, 0.8, 9, 5).translate(0, 4.5, 0);
  const tiers = [
    new THREE.ConeGeometry(5, 8, 6).translate(0, 11, 0),
    new THREE.ConeGeometry(4, 7, 6).translate(0, 15.5, 0),
    new THREE.ConeGeometry(2.8, 6, 6).translate(0, 20, 0),
  ];
  return mergeGeometries([
    part(trunk, '#5b4331'),
    ...tiers.map((tier, i) => part(tier, ['#2f4a2a', '#34522e', '#3a5a32'][i]!)),
  ]);
};

/** A boulder: a lumpy, squashed icosahedron about 1 unit across, scaled up per instance */
const rock = (): THREE.BufferGeometry => {
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    position.setXYZ(
      i,
      position.getX(i) * rndBetween(0.75, 1.2),
      position.getY(i) * rndBetween(0.45, 0.7) + 0.2,
      position.getZ(i) * rndBetween(0.75, 1.2)
    );
  }
  return part(geometry, '#6e6258');
};

/** A cardón (Euphorbia canariensis): a clump of upright grey-green stems, ~5 units high */
const cardon = (): THREE.BufferGeometry => {
  const stems = Array.from({ length: 9 }, (_, i) => {
    const angle = (i / 9) * Math.PI * 2;
    const ring = i === 0 ? 0 : rndBetween(1.2, 3.2);
    const height = rndBetween(3, 6);
    return new THREE.CylinderGeometry(0.45, 0.5, height, 5).translate(
      Math.cos(angle) * ring,
      height / 2,
      Math.sin(angle) * ring
    );
  });
  return part(mergeGeometries(stems), '#7d8b5c');
};

/** A rainforest tree: a short trunk under two lumpy rounded crowns, ~14 units high */
const broadleaf = (): THREE.BufferGeometry => {
  const trunk = new THREE.CylinderGeometry(0.5, 0.7, 6, 5).translate(0, 3, 0);
  const crown = new THREE.IcosahedronGeometry(4.5, 0).scale(1, 0.75, 1).translate(0, 9, 0);
  const top = new THREE.IcosahedronGeometry(3, 0).scale(1, 0.8, 1).translate(1.2, 12, -0.8);
  return mergeGeometries([part(trunk, '#4f3b2b'), part(crown, '#2c4a26'), part(top, '#36592d')]);
};

/** A building: a white box standing on its base, sized and coloured per instance */
const block = (): THREE.BufferGeometry =>
  // Sunk a little, so it stays on the ground where the slope falls away from one corner
  part(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.42, 0), '#ffffff');

/** A resort block: a white box with a terracotta roof slab, sized and coloured per instance */
const resort = (): THREE.BufferGeometry =>
  mergeGeometries([
    part(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.42, 0), '#ffffff'),
    part(new THREE.BoxGeometry(1.04, 0.08, 1.04).translate(0, 0.96, 0), '#b8603f'),
  ]);

const uniform = (min: number, max: number) => () => {
  const size = rndBetween(min, max);
  return new THREE.Vector3(size, size, size);
};

interface Template {
  geometry: () => THREE.BufferGeometry;
  /** Width, height and depth of one instance */
  size: () => THREE.Vector3;
  /** Instances take one of these colours (the template is white where they should show) */
  colors?: string[];
  /** Square to the area's heading rather than turned any way */
  aligned?: boolean;
}

const TEMPLATES: Record<ScatterKind, Template> = {
  pine: { geometry: pine, size: uniform(0.8, 1.25) },
  rock: { geometry: rock, size: uniform(3, 9) },
  cardon: { geometry: cardon, size: uniform(0.8, 1.4) },
  // Big enough that neighbours' crowns touch and the forest reads as a canopy
  broadleaf: { geometry: broadleaf, size: uniform(1.8, 3) },
  // Rio's apartment towers: 8 to 30 floors on narrow plots
  tower: {
    geometry: block,
    size: () => new THREE.Vector3(rndBetween(12, 20), rndBetween(25, 90), rndBetween(12, 20)),
    colors: ['#f2efe8', '#e6e0d4', '#d9d4cc', '#efe6d8', '#cfd3d6', '#e9dccb'],
    aligned: true,
  },
  // Favela houses: two or three floors of brick and paint, packed up the hillside
  favela: {
    geometry: block,
    size: () => new THREE.Vector3(rndBetween(5, 8), rndBetween(4, 9), rndBetween(5, 8)),
    colors: [
      '#b5651d',
      '#c2703d',
      '#9c5a3c',
      '#d4a373',
      '#e8d9b5',
      '#8fb3c9',
      '#e0c06a',
      '#c9b8a6',
    ],
    aligned: true,
  },
  // Costa Adeje's hotels and apartments: long white blocks of three to six floors
  resort: {
    geometry: resort,
    size: () => new THREE.Vector3(rndBetween(22, 50), rndBetween(9, 20), rndBetween(12, 20)),
    colors: ['#ffffff', '#f7f1e6', '#f3e9d6', '#efe2c8'],
    aligned: true,
  },
};

/** Random points in each area, dropped onto the ground, keeping those that fit its heights */
const placements = (area: ScatterArea, terrain: THREE.Mesh): THREE.Vector3[] => {
  const raycaster = new THREE.Raycaster();
  raycaster.firstHitOnly = true;
  const down = new THREE.Vector3(0, -1, 0);
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < area.count * ATTEMPTS && points.length < area.count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * area.radius;
    const x = area.x + Math.cos(angle) * distance;
    const z = area.z + Math.sin(angle) * distance;
    raycaster.set(new THREE.Vector3(x, 100000, z), down);
    const hit = raycaster.intersectObject(terrain)[0];
    if (!hit) continue;
    const y = hit.point.y;
    if (y < Math.max(SHORE, area.minHeight ?? SHORE)) continue;
    if (area.maxHeight !== undefined && y > area.maxHeight) continue;
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
};

/**
 * Pines, boulders and cardones over the ground: one instanced mesh per kind, so a few thousand
 * of them cost a few draw calls. The terrain must be placed in the scene (its matrices current).
 */
export function addScatter(
  scene: THREE.Scene,
  terrain: THREE.Mesh,
  areas: ScatterArea[]
): THREE.InstancedMesh[] {
  terrain.updateMatrixWorld(true);
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.9,
  });
  const kinds = [...new Set(areas.map(area => area.kind))];
  const up = new THREE.Vector3(0, 1, 0);
  return kinds.map(kind => {
    const template = TEMPLATES[kind];
    const placed = areas
      .filter(area => area.kind === kind)
      .flatMap(area => placements(area, terrain).map(point => ({ point, area })));
    const mesh = new THREE.InstancedMesh(template.geometry(), material, placed.length);
    mesh.name = `scatter-${kind}`;
    const matrix = new THREE.Matrix4();
    const turn = new THREE.Quaternion();
    const color = new THREE.Color();
    placed.forEach(({ point, area }, i) => {
      const angle = template.aligned
        ? (area.heading ?? 0) + (Math.floor(Math.random() * 4) * Math.PI) / 2
        : Math.random() * Math.PI * 2;
      turn.setFromAxisAngle(up, angle);
      matrix.compose(point, turn, template.size());
      mesh.setMatrixAt(i, matrix);
      if (template.colors) {
        const pick = template.colors[Math.floor(Math.random() * template.colors.length)]!;
        mesh.setColorAt(i, color.set(pick));
      }
    });
    mesh.receiveShadow = true;
    mesh.castShadow = Boolean(template.colors);
    scene.add(mesh);
    return mesh;
  });
}
