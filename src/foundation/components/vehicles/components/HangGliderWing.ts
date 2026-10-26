import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface HangGliderWingOptions extends SimpleComponentOptions {
  sailColor?: string;
  leadingEdgeColor?: string;
  frameColor?: string;
  wireColor?: string;
}

/** Dimensions in metres, roughly those of a modern single-surface flex wing */
const SPAN = 10;
const NOSE_X = 1.9;
const TIP_X = -0.9;
const TIP_CHORD = 0.7;
const KEEL_TAIL_X = -1.3;
/** The sail is raised a little towards the tips */
const TIP_RISE = 0.25;
/** Billow: how far the sail bulges up between leading edge and trailing edge, as a share of chord */
const CAMBER = 0.07;
/** The band of the sail behind the leading edge that is drawn in the leading edge colour */
const LEADING_EDGE_BAND = 0.22;

const SPAN_SEGMENTS = 16;
const CHORD_SEGMENTS = 10;

/** Where the crossbar meets each leading edge, as a share of the half span */
const CROSSBAR_SPAN = 0.55;
/** The control frame hangs from the keel here */
const HANG_POINT_X = 0.25;
const KINGPOST_HEIGHT = 0.9;
const CONTROL_FRAME_DEPTH = 1.6;
const BASEBAR_HALF = 0.75;
const BASEBAR_X = 0.85;

/**
 * Hang glider wing - a flex wing delta: a billowed two-tone sail on swept leading edges,
 * keel and crossbar, the kingpost on top and the triangular control frame below, braced
 * by flying and landing wires. Nose points along +X, span along Z, in metres; the hang
 * point is at the origin.
 */
export class HangGliderWing extends SimpleThreeComponent {
  constructor(options: HangGliderWingOptions = {}) {
    super(
      {
        name: 'HangGliderWing',
        version: '3.0.0',
        description: 'Flex wing delta with sail, frame and rigging',
      },
      {
        sailColor: '#FF6B35',
        leadingEdgeColor: '#1F2A44',
        frameColor: '#C9CED6',
        wireColor: '#3A3F47',
        castShadow: true,
        receiveShadow: true,
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Placeholder - not used since we override createObject
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const options = this.options as HangGliderWingOptions;
    const group = new THREE.Group();
    group.name = 'HangGliderWing';

    group.add(this.createSail(options));
    group.add(this.createFrame(options));
    group.add(this.createWires(options));

    return group;
  }

  /** Leading edge point at share u of the half span on the side given by sign */
  private leadingEdge(u: number, sign: number): THREE.Vector3 {
    return new THREE.Vector3(
      THREE.MathUtils.lerp(NOSE_X, TIP_X, u),
      TIP_RISE * u * u,
      sign * u * (SPAN / 2)
    );
  }

  /** Trailing edge point at share u of the half span, cut slightly forward between keel and tip */
  private trailingEdge(u: number, sign: number): THREE.Vector3 {
    const tip = this.leadingEdge(1, sign);
    const x =
      THREE.MathUtils.lerp(KEEL_TAIL_X, TIP_X - TIP_CHORD, u) + Math.sin(Math.PI * u) * 0.25;
    return new THREE.Vector3(x, tip.y * u, sign * u * (SPAN / 2));
  }

  private createSail(options: HangGliderWingOptions): THREE.Mesh {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const sail = new THREE.Color(options.sailColor);
    const band = new THREE.Color(options.leadingEdgeColor);
    const rowSize = CHORD_SEGMENTS + 1;

    // Each half is a grid from the keel (u = 0) to the tip, leading edge (v = 0) to trailing edge
    [-1, 1].forEach(sign => {
      const base = positions.length / 3;
      for (let i = 0; i <= SPAN_SEGMENTS; i++) {
        const u = i / SPAN_SEGMENTS;
        const le = this.leadingEdge(u, sign);
        const te = this.trailingEdge(u, sign);
        const chord = le.distanceTo(te);
        for (let j = 0; j <= CHORD_SEGMENTS; j++) {
          const v = j / CHORD_SEGMENTS;
          const p = le.clone().lerp(te, v);
          // Billow fades out at the keel and the tip, where the sail is held tight
          p.y += CAMBER * chord * Math.sin(Math.PI * v) * Math.sin(Math.PI * Math.min(1, u * 1.15));
          positions.push(p.x, p.y, p.z);
          const c = v < LEADING_EDGE_BAND ? band : sail;
          colors.push(c.r, c.g, c.b);
        }
      }
      for (let i = 0; i < SPAN_SEGMENTS; i++) {
        for (let j = 0; j < CHORD_SEGMENTS; j++) {
          const a = base + i * rowSize + j;
          const b = a + rowSize;
          // Keep the winding facing up on both halves
          if (sign > 0) indices.push(a, a + 1, b, b, a + 1, b + 1);
          else indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = resourceManager.getOrCreateMaterial(
      'hangglider_sail',
      () =>
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          side: THREE.DoubleSide,
          roughness: 0.75,
          metalness: 0.05,
        })
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'sail';
    return mesh;
  }

  private tube(from: THREE.Vector3, to: THREE.Vector3, radius: number, material: THREE.Material) {
    const length = from.distanceTo(to);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), material);
    mesh.position.copy(from).lerp(to, 0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      to.clone().sub(from).normalize()
    );
    return mesh;
  }

  private createFrame(options: HangGliderWingOptions): THREE.Group {
    const frame = new THREE.Group();
    frame.name = 'frame';
    const material = resourceManager.getOrCreateMaterial(
      `hangglider_frame_${options.frameColor}`,
      () =>
        new THREE.MeshStandardMaterial({
          color: options.frameColor,
          metalness: 0.7,
          roughness: 0.35,
        })
    );

    const nose = new THREE.Vector3(NOSE_X, 0, 0);
    const keelTail = new THREE.Vector3(KEEL_TAIL_X, 0, 0);
    const hang = new THREE.Vector3(HANG_POINT_X, 0, 0);

    frame.add(this.tube(nose, keelTail, 0.035, material));
    frame.add(this.tube(nose, this.leadingEdge(1, 1), 0.04, material));
    frame.add(this.tube(nose, this.leadingEdge(1, -1), 0.04, material));
    // The crossbar sits just under the sail
    const crossbarLeft = this.leadingEdge(CROSSBAR_SPAN, -1).setY(-0.03);
    const crossbarRight = this.leadingEdge(CROSSBAR_SPAN, 1).setY(-0.03);
    frame.add(this.tube(crossbarLeft, crossbarRight, 0.03, material));
    frame.add(this.tube(hang, hang.clone().setY(KINGPOST_HEIGHT), 0.025, material));

    const [baseLeft, baseRight] = this.basebarEnds();
    frame.add(this.tube(hang, baseLeft, 0.025, material));
    frame.add(this.tube(hang, baseRight, 0.025, material));
    frame.add(this.tube(baseLeft, baseRight, 0.025, material));

    return frame;
  }

  private basebarEnds(): [THREE.Vector3, THREE.Vector3] {
    return [
      new THREE.Vector3(BASEBAR_X, -CONTROL_FRAME_DEPTH, -BASEBAR_HALF),
      new THREE.Vector3(BASEBAR_X, -CONTROL_FRAME_DEPTH, BASEBAR_HALF),
    ];
  }

  /** Thin wires stay a line wide at any distance, which a cylinder this thin would not */
  private createWires(options: HangGliderWingOptions): THREE.LineSegments {
    const nose = new THREE.Vector3(NOSE_X, 0, 0);
    const keelTail = new THREE.Vector3(KEEL_TAIL_X, 0, 0);
    const kingpostTop = new THREE.Vector3(HANG_POINT_X, KINGPOST_HEIGHT, 0);
    const points: THREE.Vector3[] = [];

    this.basebarEnds().forEach(corner => {
      const sign = Math.sign(corner.z);
      // Flying wires take the load from the control frame to the wing
      points.push(corner, nose, corner, keelTail, corner, this.leadingEdge(CROSSBAR_SPAN, sign));
      // Landing wires hold the wing up from the kingpost
      points.push(kingpostTop, this.leadingEdge(CROSSBAR_SPAN, sign));
      points.push(kingpostTop, this.leadingEdge(0.85, sign));
    });
    points.push(kingpostTop, nose, kingpostTop, keelTail);

    const material = resourceManager.getOrCreateMaterial(
      `hangglider_wire_${options.wireColor}`,
      () => new THREE.LineBasicMaterial({ color: options.wireColor })
    );
    const wires = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(points),
      material
    );
    wires.name = 'wires';
    return wires;
  }
}

export default HangGliderWing;
