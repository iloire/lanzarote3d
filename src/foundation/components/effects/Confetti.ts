import * as THREE from 'three';

const COLOURS = ['#ff3d8b', '#ffd23f', '#3bceac', '#4aff9e', '#ffffff', '#7b6cff'];
const PIECES = 40;
/** A flake's size, and how hard up and out the burst throws them, in metres at life size */
const FLAKE = 0.22;
const UP: [number, number] = [2.5, 5];
const OUT = 2.5;
/** Light paper: gravity barely wins against the air, which bleeds off their speed */
const GRAVITY = 3;
const DRAG = 1.2;
/** Seconds each flake lasts; it shrinks away over the last `FADE` of them */
const LIFE: [number, number] = [2, 3];
const FADE = 0.8;

const rand = ([min, max]: [number, number]) => THREE.MathUtils.lerp(min, max, Math.random());
const matrix = new THREE.Matrix4();
const rotation = new THREE.Quaternion();
const scale = new THREE.Vector3();
const euler = new THREE.Euler();

/**
 * A small puff of voxel confetti thrown up from `origin` in its parent's space, so it travels
 * with whatever it's added to, at `size` times life size. Flakes tumble, drift down and shrink away; one instanced mesh, so
 * a burst is a single draw call. Call `update` every frame until it returns false, then dispose.
 */
export class ConfettiBurst {
  readonly mesh: THREE.InstancedMesh;
  private readonly pos: THREE.Vector3[] = [];
  private readonly vel: THREE.Vector3[] = [];
  private readonly spin: THREE.Vector3[] = [];
  private readonly turn: THREE.Vector3[] = [];
  private readonly life: number[] = [];
  private age = 0;

  constructor(
    origin: THREE.Vector3,
    private readonly size = 1
  ) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(FLAKE * size, FLAKE * size, FLAKE * size * 0.2),
      new THREE.MeshLambertMaterial(),
      PIECES
    );
    this.mesh.name = 'confetti';
    this.mesh.frustumCulled = false;
    const colour = new THREE.Color();
    for (let i = 0; i < PIECES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const out = Math.random() * OUT * size;
      this.pos.push(origin.clone());
      this.vel.push(
        new THREE.Vector3(Math.cos(angle) * out, rand(UP) * size, Math.sin(angle) * out)
      );
      this.spin.push(
        new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(6)
      );
      this.turn.push(
        new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(7)
      );
      this.life.push(rand(LIFE));
      this.mesh.setColorAt(i, colour.set(COLOURS[i % COLOURS.length]!));
    }
    this.update(0);
  }

  /** Moves the flakes on by `dt` seconds; false once the last of them has gone */
  update(dt: number): boolean {
    this.age += dt;
    const drag = Math.exp(-DRAG * dt);
    for (let i = 0; i < PIECES; i++) {
      const vel = this.vel[i]!;
      vel.multiplyScalar(drag);
      vel.y -= GRAVITY * this.size * dt;
      this.pos[i]!.addScaledVector(vel, dt);
      this.spin[i]!.addScaledVector(this.turn[i]!, dt);
      const left = this.life[i]! - this.age;
      scale.setScalar(THREE.MathUtils.clamp(left / FADE, 0, 1));
      rotation.setFromEuler(euler.setFromVector3(this.spin[i]!));
      this.mesh.setMatrixAt(i, matrix.compose(this.pos[i]!, rotation, scale));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    return this.age < LIFE[1];
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
