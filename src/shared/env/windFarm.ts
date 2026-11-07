import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { ISLAND_ANCHOR, geoToWorld } from '../geo';
import { getTerrainHeight } from './mesh-utils';
import { LANDMARK_SCALE } from './landmarks';

/**
 * The Los Valles wind farm on the Famara massif, its ten turbines placed from OpenStreetMap
 * (`generator:source=wind` nodes, © OpenStreetMap contributors, ODbL)
 */
const TURBINES: [number, number][] = [
  [29.0923, -13.5032],
  [29.0928, -13.5044],
  [29.093, -13.5059],
  [29.0944, -13.5059],
  [29.0953, -13.5066],
  [29.0961, -13.5073],
  [29.0969, -13.5081],
  [29.0979, -13.5085],
  [29.0985, -13.5096],
  [29.0996, -13.5102],
];

// Metres, about an Enercon E-44: hub height, blade length
const HUB = 45;
const BLADE = 21;
// The rotors face the trade wind, from the north-north-east (compass degrees)
const WIND_FROM = 20;
// Radians a second, about 14 rpm, each rotor a little off its neighbours
const SPIN = 1.5;

/** A tapering tower with its nacelle on top, metres, the rotor's side towards +z */
const tower = (): THREE.BufferGeometry =>
  mergeGeometries([
    new THREE.CylinderGeometry(1.1, 1.9, HUB, 8, 1, true).translate(0, HUB / 2, 0),
    new THREE.BoxGeometry(2.4, 2.6, 6).translate(0, HUB, -1.2),
  ])!;

/** Three blades round a hub at the origin, in the xy plane, turning about z */
const rotor = (): THREE.BufferGeometry => {
  const blades = [0, 1, 2].map(i =>
    new THREE.BoxGeometry(1.5, BLADE, 0.35)
      .translate(0, BLADE / 2 + 0.8, 0)
      .rotateZ((i * 2 * Math.PI) / 3)
  );
  return mergeGeometries([
    ...blades,
    new THREE.ConeGeometry(1.1, 2.2, 8).rotateX(Math.PI / 2).translate(0, 0, 0.6),
  ])!;
};

/**
 * Ten white turbines on the skyline east of the takeoff, twice life size like the landmarks.
 * Two instanced meshes, towers and rotors, so the whole farm is two draw calls; only the ten
 * rotor matrices change each frame.
 */
export class WindFarm {
  readonly group = new THREE.Group();
  private readonly rotors: THREE.InstancedMesh;
  private readonly hubs: THREE.Vector3[] = [];
  private readonly facing: THREE.Quaternion;
  private readonly spin = new THREE.Quaternion();
  private readonly turn = new THREE.Quaternion();
  private readonly matrix = new THREE.Matrix4();
  private readonly scale = new THREE.Vector3().setScalar(LANDMARK_SCALE);
  private readonly forward = new THREE.Vector3(0, 0, 1);
  private angle = 0;

  constructor(terrain: THREE.Mesh) {
    const material = new THREE.MeshStandardMaterial({ color: '#eef0ee', roughness: 0.55 });
    // Compass heading of the front (+z), as the landmarks turn theirs
    this.facing = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(180 - WIND_FROM)
    );
    const bases = TURBINES.map(([lat, lon]) => {
      const { x, z } = geoToWorld(lat, lon, ISLAND_ANCHOR);
      return new THREE.Vector3(x, getTerrainHeight(x, z, terrain), z);
    }).filter(base => !isNaN(base.y));

    const towers = new THREE.InstancedMesh(tower(), material, bases.length);
    this.rotors = new THREE.InstancedMesh(rotor(), material, bases.length);
    const front = new THREE.Vector3(0, 0, 0.6 * LANDMARK_SCALE).applyQuaternion(this.facing);
    bases.forEach((base, i) => {
      this.matrix.compose(base, this.facing, this.scale);
      towers.setMatrixAt(i, this.matrix);
      this.hubs.push(
        base
          .clone()
          .add(new THREE.Vector3(0, HUB * LANDMARK_SCALE, 0))
          .add(front)
      );
    });
    towers.name = 'wind-farm-towers';
    this.rotors.name = 'wind-farm-rotors';
    this.update(0);
    // Bounds over every instance, so the farm is culled when it is out of view; the rotors only
    // spin in place, so the first frame's bounds still hold
    [towers, this.rotors].forEach(mesh => {
      mesh.castShadow = true;
      mesh.computeBoundingSphere();
      this.group.add(mesh);
    });
    this.group.name = 'Los Valles wind farm';
  }

  /** Turns the rotors on by `deltaTime` seconds */
  update(deltaTime: number): void {
    this.angle += SPIN * deltaTime;
    this.hubs.forEach((hub, i) => {
      this.spin.setFromAxisAngle(this.forward, -(this.angle + i * 0.7));
      this.turn.multiplyQuaternions(this.facing, this.spin);
      this.matrix.compose(hub, this.turn, this.scale);
      this.rotors.setMatrixAt(i, this.matrix);
    });
    this.rotors.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.group.children.forEach(child => {
      const mesh = child as THREE.InstancedMesh;
      mesh.geometry.dispose();
      mesh.dispose();
    });
    ((this.group.children[0] as THREE.Mesh).material as THREE.Material).dispose();
  }
}
