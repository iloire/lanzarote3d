import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { rndBetween } from '../../foundation/utils/math';

export type ScatterKind = 'pine' | 'rock' | 'cardon';

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

const TEMPLATES: Record<ScatterKind, { geometry: () => THREE.BufferGeometry; scale: number[] }> = {
  pine: { geometry: pine, scale: [0.8, 1.25] },
  rock: { geometry: rock, scale: [3, 9] },
  cardon: { geometry: cardon, scale: [0.8, 1.4] },
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
  return kinds.map(kind => {
    const points = areas.filter(a => a.kind === kind).flatMap(a => placements(a, terrain));
    const { geometry, scale } = TEMPLATES[kind];
    const mesh = new THREE.InstancedMesh(geometry(), material, points.length);
    mesh.name = `scatter-${kind}`;
    const matrix = new THREE.Matrix4();
    const turn = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    points.forEach((point, i) => {
      const size = rndBetween(scale[0]!, scale[1]!);
      turn.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      matrix.compose(point, turn, new THREE.Vector3(size, size, size));
      mesh.setMatrixAt(i, matrix);
    });
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  });
}
