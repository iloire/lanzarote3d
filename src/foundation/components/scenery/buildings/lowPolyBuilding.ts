import * as THREE from 'three';
import { LODComponent } from '../../base/LODComponent';
import { MeshBuilder, circle, lowPolyMaterial } from '../../base/lowPolyMesh';
import { LevelOfDetail } from '../../../types/lod';

/**
 * Low-poly buildings. Towns place hundreds of these, so each one is a single vertex-coloured
 * mesh that mergeStaticMeshes folds with every other house into one draw call. Walls are open
 * boxes, roofs are a handful of triangles, and doors, windows and trim are flat panels standing
 * just proud of the wall, so a window costs two triangles. Every LOD shares one builder that adds
 * detail as the level rises. ULTRA_LOW, what the towns use, is only massing and roof (10 to 26
 * triangles), because from the air nobody can see a window. LOW adds doors and windows, MEDIUM
 * frames, trim and chimneys, HIGH shutters, balconies and props.
 */

/** An axis-aligned box: x and z extents on the ground, y from base to top */
export interface Volume {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

/** A box centred on (cx, cz), `width` along x and `depth` along z */
export const volume = (
  cx: number,
  cz: number,
  width: number,
  depth: number,
  y0: number,
  y1: number
): Volume => ({
  x0: cx - width / 2,
  x1: cx + width / 2,
  y0,
  y1,
  z0: cz - depth / 2,
  z1: cz + depth / 2,
});

/** Which wall a panel goes on: +z is the front */
export type Face = '+z' | '-z' | '+x' | '-x';

/** How far panels stand off the wall, enough to hold up against z-fighting from afar */
const PANEL = 0.2;
const FRAME = 0.12;

export const color = (hex: string | undefined, fallback: string): THREE.Color =>
  new THREE.Color(hex ?? fallback);

/** The four walls of a volume, with an optional lid. No floor: it stands on the ground. */
export const walls = (mesh: MeshBuilder, v: Volume, wall: THREE.Color, top?: THREE.Color) => {
  const c = [
    [v.x0, v.z0],
    [v.x1, v.z0],
    [v.x1, v.z1],
    [v.x0, v.z1],
  ];
  c.forEach(([x, z], i) => {
    const [nx, nz] = c[(i + 1) % 4]!;
    const p = (px: number, y: number, pz: number) => new THREE.Vector3(px, y, pz);
    mesh.quad(p(x!, v.y0, z!), p(nx!, v.y0, nz!), p(nx!, v.y1, nz!), p(x!, v.y1, z!), wall);
  });
  if (top) lid(mesh, v, v.y1, top);
};

/** A horizontal quad over the volume's footprint at height y, grown by `grow` all round */
export const lid = (mesh: MeshBuilder, v: Volume, y: number, c: THREE.Color, grow = 0) => {
  const p = (x: number, z: number) => new THREE.Vector3(x, y, z);
  mesh.quad(
    p(v.x0 - grow, v.z0 - grow),
    p(v.x1 + grow, v.z0 - grow),
    p(v.x1 + grow, v.z1 + grow),
    p(v.x0 - grow, v.z1 + grow),
    c
  );
};

/** A closed block: walls and lid */
export const block = (mesh: MeshBuilder, v: Volume, c: THREE.Color) => walls(mesh, v, c, c);

/**
 * Flat roof behind a parapet: the walls already rise past the roof, and their inner faces show
 * from above (the material is double-sided), so the parapet costs nothing but the roof quad.
 */
export const flatRoof = (mesh: MeshBuilder, v: Volume, roof: THREE.Color, parapet = 0.8) =>
  lid(mesh, v, v.y1 - parapet, roof);

/** Gabled roof from the top of the walls, ridge along `axis`, gable ends in the wall colour */
export const gableRoof = (
  mesh: MeshBuilder,
  v: Volume,
  axis: 'x' | 'z',
  height: number,
  overhang: number,
  roof: THREE.Color,
  gable: THREE.Color
) => {
  const y = v.y1;
  const top = y + height;
  const o = overhang;
  if (axis === 'x') {
    const zm = (v.z0 + v.z1) / 2;
    const p = (x: number, py: number, z: number) => new THREE.Vector3(x, py, z);
    // Eaves drop a little as they overhang, keeping the pitch
    const drop = (o * height) / ((v.z1 - v.z0) / 2);
    mesh.quad(
      p(v.x0 - o, y - drop, v.z0 - o),
      p(v.x1 + o, y - drop, v.z0 - o),
      p(v.x1 + o, top, zm),
      p(v.x0 - o, top, zm),
      roof
    );
    mesh.quad(
      p(v.x0 - o, y - drop, v.z1 + o),
      p(v.x1 + o, y - drop, v.z1 + o),
      p(v.x1 + o, top, zm),
      p(v.x0 - o, top, zm),
      roof
    );
    [v.x0, v.x1].forEach(x => mesh.tri(p(x, y, v.z0), p(x, y, v.z1), p(x, top, zm), gable));
  } else {
    const xm = (v.x0 + v.x1) / 2;
    const p = (x: number, py: number, z: number) => new THREE.Vector3(x, py, z);
    const drop = (o * height) / ((v.x1 - v.x0) / 2);
    mesh.quad(
      p(v.x0 - o, y - drop, v.z0 - o),
      p(v.x0 - o, y - drop, v.z1 + o),
      p(xm, top, v.z1 + o),
      p(xm, top, v.z0 - o),
      roof
    );
    mesh.quad(
      p(v.x1 + o, y - drop, v.z0 - o),
      p(v.x1 + o, y - drop, v.z1 + o),
      p(xm, top, v.z1 + o),
      p(xm, top, v.z0 - o),
      roof
    );
    [v.z0, v.z1].forEach(z => mesh.tri(p(v.x0, y, z), p(v.x1, y, z), p(xm, top, z), gable));
  }
};

/** Hipped roof: four slopes up to a ridge along the longer side (a pyramid when square) */
export const hipRoof = (
  mesh: MeshBuilder,
  v: Volume,
  height: number,
  overhang: number,
  roof: THREE.Color
) => {
  const [x0, x1, z0, z1] = [v.x0 - overhang, v.x1 + overhang, v.z0 - overhang, v.z1 + overhang];
  const y = v.y1;
  const top = y + height;
  const half = Math.min(x1 - x0, z1 - z0) / 2;
  const [xm, zm] = [(x0 + x1) / 2, (z0 + z1) / 2];
  const alongX = x1 - x0 >= z1 - z0;
  const r = Math.max(0, (alongX ? x1 - x0 : z1 - z0) / 2 - half);
  const ra = alongX ? new THREE.Vector3(xm - r, top, zm) : new THREE.Vector3(xm, top, zm - r);
  const rb = alongX ? new THREE.Vector3(xm + r, top, zm) : new THREE.Vector3(xm, top, zm + r);
  const p = (x: number, z: number) => new THREE.Vector3(x, y, z);
  const [a, b, c, d] = [p(x0, z0), p(x1, z0), p(x1, z1), p(x0, z1)];
  if (r === 0) {
    [a, b, c, d].forEach((q, i) => mesh.tri(q, [b, c, d, a][i]!, ra, roof));
    return;
  }
  if (alongX) {
    mesh.quad(a, b, rb, ra, roof);
    mesh.quad(d, c, rb, ra, roof);
    mesh.tri(a, d, ra, roof);
    mesh.tri(b, c, rb, roof);
  } else {
    mesh.quad(a, d, rb, ra, roof);
    mesh.quad(b, c, rb, ra, roof);
    mesh.tri(a, b, ra, roof);
    mesh.tri(d, c, rb, roof);
  }
};

/** A point on a face: u runs along the wall from its centre, y is height, standing `off` proud */
const onFace = (v: Volume, face: Face, u: number, y: number, off: number): THREE.Vector3 => {
  const [xm, zm] = [(v.x0 + v.x1) / 2, (v.z0 + v.z1) / 2];
  switch (face) {
    case '+z':
      return new THREE.Vector3(xm + u, y, v.z1 + off);
    case '-z':
      return new THREE.Vector3(xm - u, y, v.z0 - off);
    case '+x':
      return new THREE.Vector3(v.x1 + off, y, zm - u);
    case '-x':
      return new THREE.Vector3(v.x0 - off, y, zm + u);
  }
};

/** Half the length of a face */
export const faceHalf = (v: Volume, face: Face): number =>
  (face === '+z' || face === '-z' ? v.x1 - v.x0 : v.z1 - v.z0) / 2;

/** A flat rectangle on a face, centred at u, from y0 up h */
export const panel = (
  mesh: MeshBuilder,
  v: Volume,
  face: Face,
  u: number,
  y0: number,
  w: number,
  h: number,
  c: THREE.Color,
  off = PANEL
) => {
  const q = (du: number, y: number) => onFace(v, face, u + du, y, off);
  mesh.quad(q(-w / 2, y0), q(w / 2, y0), q(w / 2, y0 + h), q(-w / 2, y0 + h), c);
};

/** A straight strip on a face between two (u, y) points: braces, bands, glazing bars */
export const strip = (
  mesh: MeshBuilder,
  v: Volume,
  face: Face,
  from: [number, number],
  to: [number, number],
  width: number,
  c: THREE.Color,
  off = PANEL + 0.05
) => {
  const [du, dy] = [to[0] - from[0], to[1] - from[1]];
  const len = Math.hypot(du, dy);
  const [nu, ny] = [(-dy / len) * (width / 2), (du / len) * (width / 2)];
  const q = (u: number, y: number) => onFace(v, face, u, y, off);
  mesh.quad(
    q(from[0] - nu, from[1] - ny),
    q(to[0] - nu, to[1] - ny),
    q(to[0] + nu, to[1] + ny),
    q(from[0] + nu, from[1] + ny),
    c
  );
};

export interface OpeningStyle {
  pane: THREE.Color;
  /** A surround, drawn behind the pane and `frameWidth` wider all round */
  frame?: THREE.Color;
  frameWidth?: number;
  /** Shutters either side, each a third of the opening's width */
  shutters?: THREE.Color;
}

/** A window or door: the pane, optionally framed and shuttered */
export const opening = (
  mesh: MeshBuilder,
  v: Volume,
  face: Face,
  u: number,
  y0: number,
  w: number,
  h: number,
  style: OpeningStyle
) => {
  if (style.frame) {
    const f = style.frameWidth ?? 0.4;
    panel(mesh, v, face, u, y0 - f, w + 2 * f, h + 2 * f, style.frame, FRAME);
  }
  panel(mesh, v, face, u, y0, w, h, style.pane);
  if (style.shutters) {
    const s = w * 0.35;
    [-1, 1].forEach(side =>
      panel(mesh, v, face, u + side * (w / 2 + s / 2 + 0.15), y0, s, h, style.shutters!, FRAME)
    );
  }
};

/** `count` openings evenly spread along a face, `margin` kept clear at each end */
export const openingRow = (
  mesh: MeshBuilder,
  v: Volume,
  face: Face,
  count: number,
  y0: number,
  w: number,
  h: number,
  style: OpeningStyle,
  margin = 0
) => {
  const half = faceHalf(v, face) - margin;
  for (let i = 0; i < count; i++) {
    const u = count === 1 ? 0 : -half + w / 2 + ((2 * half - w) * i) / (count - 1);
    opening(mesh, v, face, u, y0, w, h, style);
  }
};

/** A horizontal band round all four walls: string courses, cornices, plinths */
export const band = (mesh: MeshBuilder, v: Volume, y0: number, h: number, c: THREE.Color) =>
  (['+z', '-z', '+x', '-x'] as Face[]).forEach(face =>
    panel(mesh, v, face, 0, y0, 2 * faceHalf(v, face) + 2 * FRAME, h, c, FRAME)
  );

/** A low-poly cylinder standing on the ground: tanks, silos, columns */
export const cylinder = (
  mesh: MeshBuilder,
  cx: number,
  cz: number,
  radius: number,
  y0: number,
  y1: number,
  c: THREE.Color,
  sides = 6,
  capped = true
) => {
  const ring = (y: number) => circle(new THREE.Vector3(cx, y, cz), radius, sides, 'y');
  const [bottom, top] = [ring(y0), ring(y1)];
  bottom.forEach((p, i) => {
    const n = (i + 1) % sides;
    mesh.quad(p, bottom[n]!, top[n]!, top[i]!, c);
  });
  if (capped) mesh.cap(top, c);
};

/** A cone or pyramid on top of a cylinder: silo caps, palm crowns */
export const cone = (
  mesh: MeshBuilder,
  cx: number,
  cz: number,
  radius: number,
  y0: number,
  height: number,
  c: THREE.Color,
  sides = 6
) => {
  const base = circle(new THREE.Vector3(cx, y0, cz), radius, sides, 'y');
  const apex = new THREE.Vector3(cx, y0 + height, cz);
  base.forEach((p, i) => mesh.tri(apex, p, base[(i + 1) % sides]!, c));
};

/** The Lanzarote chimney: a white stack with a little capped hood */
export const chimney = (
  mesh: MeshBuilder,
  cx: number,
  cz: number,
  y0: number,
  height: number,
  c: THREE.Color
) => {
  block(mesh, volume(cx, cz, 1.4, 1.4, y0, y0 + height), c);
  block(mesh, volume(cx, cz, 2.2, 2.2, y0 + height, y0 + height + 0.5), c);
  cone(mesh, cx, cz, 1.2, y0 + height + 0.5, 0.9, c, 4);
};

const TRUNK = new THREE.Color('#7A5C3E');
const FRONDS = new THREE.Color('#4E7D3A');

/** A palm: a five-sided trunk and a crown of six drooping fronds */
export const palm = (mesh: MeshBuilder, x: number, z: number, height: number) => {
  cylinder(mesh, x, z, 0.3, 0, height, TRUNK, 5, false);
  const crown = new THREE.Vector3(x, height + 0.3, z);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const tip = new THREE.Vector3(x + Math.cos(a) * 3, height - 1.2, z + Math.sin(a) * 3);
    const side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(0.5);
    mesh.tri(
      crown,
      tip
        .clone()
        .add(side)
        .setY(height - 0.2),
      tip,
      FRONDS
    );
  }
};

/**
 * Base for the low-poly buildings: all four LOD hooks build the same single mesh, passing the
 * LOD level so `build` can add detail as it rises.
 */
export abstract class LowPolyBuilding extends LODComponent {
  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in build()
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected abstract build(mesh: MeshBuilder, detail: LevelOfDetail): void;

  private buildMesh(detail: LevelOfDetail): THREE.Object3D {
    const mesh = new MeshBuilder();
    this.build(mesh, detail);
    const building = new THREE.Mesh(mesh.build(), lowPolyMaterial());
    building.name = `${this.metadata.name} (${LevelOfDetail[detail]})`;
    return building;
  }

  protected createUltraLowLODContent(): THREE.Object3D {
    return this.buildMesh(LevelOfDetail.ULTRA_LOW);
  }

  protected createLowLODContent(): THREE.Object3D {
    return this.buildMesh(LevelOfDetail.LOW);
  }

  protected createMediumLODContent(): THREE.Object3D {
    return this.buildMesh(LevelOfDetail.MEDIUM);
  }

  protected createHighLODContent(): THREE.Object3D {
    return this.buildMesh(LevelOfDetail.HIGH);
  }
}
