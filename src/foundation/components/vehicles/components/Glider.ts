import * as THREE from 'three';

/**
 * Paraglider wing, in millimetres, in its own frame: origin between the carabiners, +x forward,
 * +y up, span along z.
 *
 * The canopy is lofted through ribs, each a cambered airfoil. Seen from the front it is an arc
 * that stays flat in the middle and curls down at the tips; seen from above the chord narrows
 * elliptically to the tips and the leading edge sweeps back while the trailing edge stays nearly
 * straight. Cells billow between the ribs, and flat shading picks the ribs out.
 */

const HALF_SPAN = 4300; // flat, along the canopy
const ROOT_CHORD = 2100;
const TIP_CHORD = 0.3; // of the root chord
const THICKNESS = 0.15; // of the chord
const CAMBER = 0.045;
const LINE_HEIGHT = 4200; // carabiners to the centre of the lower surface
const TIP_ARC = 1.15; // radians the canopy has turned down by at the tip
const ARC_EXPONENT = 1.6; // > 1 keeps the centre flat and curls the tips
const CELL_BILLOW = 1.12; // profile scale midway between two ribs
const TIP_ACCENT = 0.72; // span fraction where wingColor2 takes over on the top surface
/** Span bands of the stripes near each tip, and how far back from the nose they run */
const STRIPE_BANDS: [number, number][] = [
  [0.76, 0.81],
  [0.85, 0.88],
];
const STRIPE_CHORD = 0.45;
const CARABINER_HALF_GAP = 150;
const RISER_LENGTH = 450;
const HANDS = new THREE.Vector3(-150, 380, 330); // z mirrored per side

/** Chord positions (0 = leading edge) of the airfoil outline, finer at the nose */
const PROFILE_X = [0, 0.02, 0.07, 0.15, 0.3, 0.5, 0.75, 1];
/** Chord positions of the A, B and C line rows on the lower surface */
const LINE_ROWS = [0.12, 0.4, 0.72];
const BRAKE_FROM = 0.35; // span fraction from which the brakes pull the trailing edge

const DEFAULT_OPTIONS: GliderOptions = {
  wingColor1: '#FFA500',
  wingColor2: '#b100cd',
  inletsColor: '#333333',
  lineColor: '#3a3a3a',
  numeroCajones: 40,
};

export type GliderOptions = {
  /** Canopy */
  wingColor1?: string;
  /** Top surface of the wingtips */
  wingColor2?: string;
  /** Cell openings along the leading edge */
  inletsColor?: string;
  /** Two stripes across the front of each tip, top and bottom; none when unset */
  stripeColor?: string;
  lineColor?: string;
  /** Cells per half wing */
  numeroCajones?: number;
};

type Rib = {
  /** Point on the arc the chord hangs from */
  origin: THREE.Vector3;
  /** Canopy normal at this rib, rolled outwards towards the tips */
  up: THREE.Vector3;
  chord: number;
  leadingEdgeX: number;
  /** -1 at the left tip to 1 at the right tip */
  t: number;
};

/** NACA-style cambered section: upper and lower surface heights, in chords, at chord position x */
const airfoil = (x: number): { upper: number; lower: number } => {
  const thickness =
    5 *
    THICKNESS *
    (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  const p = 0.4;
  const camber =
    x < p
      ? (CAMBER / p ** 2) * (2 * p * x - x ** 2)
      : (CAMBER / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x ** 2);
  return { upper: camber + thickness, lower: camber - thickness };
};

const chordAt = (t: number) => ROOT_CHORD * (TIP_CHORD + (1 - TIP_CHORD) * Math.sqrt(1 - t * t));
const arcAngleAt = (t: number) => Math.sign(t) * TIP_ARC * Math.abs(t) ** ARC_EXPONENT;

/**
 * Ribs from the left tip to the right one, two stations per cell (rib, then mid-cell). The arc is
 * walked step by step so that its length stays the flat span however tightly it curls.
 */
const createRibs = (cellsPerHalf: number): Rib[] => {
  const stations = cellsPerHalf * 2;
  const step = HALF_SPAN / stations;
  const half: { y: number; z: number }[] = [{ y: 0, z: 0 }];
  for (let i = 1; i <= stations; i++) {
    const angle = arcAngleAt((i - 0.5) / stations);
    const prev = half[i - 1]!;
    half.push({ y: prev.y - Math.sin(angle) * step, z: prev.z + Math.cos(angle) * step });
  }

  const rootLeadingEdge = ROOT_CHORD * 0.38;
  const ribs: Rib[] = [];
  for (let i = -stations; i <= stations; i++) {
    const t = i / stations;
    const { y, z } = half[Math.abs(i)]!;
    const angle = arcAngleAt(t);
    const chord = chordAt(t);
    ribs.push({
      origin: new THREE.Vector3(0, LINE_HEIGHT + y, Math.sign(i) * z),
      up: new THREE.Vector3(0, Math.cos(angle), Math.sin(angle)),
      chord,
      leadingEdgeX: rootLeadingEdge - 0.65 * (ROOT_CHORD - chord),
      t,
    });
  }
  return ribs;
};

/** A point of the rib's section at chord position x, height h (in chords) off the chord line */
const ribPoint = (rib: Rib, x: number, h: number, billow = 1): THREE.Vector3 =>
  new THREE.Vector3(rib.leadingEdgeX - x * rib.chord, 0, 0)
    .addScaledVector(rib.up, h * rib.chord * billow)
    .add(rib.origin);

/** Outline of a rib: top surface from trailing edge to nose, then bottom surface back */
const ribOutline = (rib: Rib, billow: number): THREE.Vector3[] => {
  const top = [...PROFILE_X].reverse().map(x => ribPoint(rib, x, airfoil(x).upper, billow));
  const bottom = PROFILE_X.slice(1, -1).map(x => ribPoint(rib, x, airfoil(x).lower, billow));
  return [...top, ...bottom];
};

const createCanopy = (ribs: Rib[], options: GliderOptions): THREE.Mesh => {
  const top = new THREE.Color(options.wingColor1);
  const tips = new THREE.Color(options.wingColor2);
  const bottom = top.clone().lerp(new THREE.Color('#000000'), 0.25);
  const inlets = new THREE.Color(options.inletsColor);
  const stripe = options.stripeColor ? new THREE.Color(options.stripeColor) : null;

  const outlines = ribs.map((rib, i) => ribOutline(rib, i % 2 === 0 ? 1 : CELL_BILLOW));
  const pointsPerRib = outlines[0]!.length;
  const topPoints = PROFILE_X.length;
  // Chord position of each outline point, in the order ribOutline lists them
  const outlineX = [...[...PROFILE_X].reverse(), ...PROFILE_X.slice(1, -1)];

  const positions: number[] = [];
  const colors: number[] = [];
  const pushTriangle = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    color: THREE.Color
  ) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let k = 0; k < 3; k++) colors.push(color.r, color.g, color.b);
  };

  for (let r = 0; r < ribs.length - 1; r++) {
    const t = Math.abs((ribs[r]!.t + ribs[r + 1]!.t) / 2);
    const a = outlines[r]!;
    const b = outlines[r + 1]!;
    for (let p = 0; p < pointsPerRib; p++) {
      const q = (p + 1) % pointsPerRib;
      const onTop = p < topPoints - 1;
      // The segment just under the nose is where the cells breathe
      const isInlet = p === topPoints - 1 && t < 0.9;
      const isStripe =
        stripe !== null &&
        (outlineX[p]! + outlineX[q]!) / 2 < STRIPE_CHORD &&
        STRIPE_BANDS.some(([from, to]) => t >= from && t <= to);
      const color = isInlet
        ? inlets
        : isStripe
          ? stripe
          : onTop
            ? t > TIP_ACCENT
              ? tips
              : top
            : bottom;
      pushTriangle(a[p]!, b[p]!, b[q]!, color);
      pushTriangle(a[p]!, b[q]!, a[q]!, color);
    }
  }

  // Close the wingtips
  [outlines[0]!, outlines[outlines.length - 1]!].forEach((outline, side) => {
    for (let p = 1; p < pointsPerRib - 1; p++) {
      const [b, c] = side === 0 ? [outline[p + 1]!, outline[p]!] : [outline[p]!, outline[p + 1]!];
      pushTriangle(outline[0]!, b, c, tips);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const canopy = new THREE.Mesh(geometry, material);
  canopy.name = 'canopy';
  canopy.castShadow = true;
  return canopy;
};

/**
 * Lines cascade as on a real wing: each row of attachment points on a half wing gathers into an
 * inner and an outer junction, and those run down to the riser. The brakes fan from the outer
 * trailing edge to one junction and down to the pilot's hand.
 */
const createLines = (
  ribs: Rib[],
  cellsPerHalf: number,
  options: GliderOptions
): THREE.LineSegments => {
  const points: THREE.Vector3[] = [];
  const line = (a: THREE.Vector3, b: THREE.Vector3) => points.push(a, b);
  // Lines attach at every other rib (stations alternate rib, mid-cell), about six per row per half
  const attachEvery = 2 * Math.max(1, Math.round(cellsPerHalf / 6));
  const centre = (ribs.length - 1) / 2;

  [-1, 1].forEach(side => {
    const riserTop = new THREE.Vector3(0, RISER_LENGTH, side * CARABINER_HALF_GAP);
    const halfRibs = ribs.filter(
      (_, i) => (i - centre) * side > 0 && (i - centre) % attachEvery === 0
    );
    const groups = [
      halfRibs.filter(rib => Math.abs(rib.t) <= 0.5),
      halfRibs.filter(rib => Math.abs(rib.t) > 0.5),
    ];

    LINE_ROWS.forEach(x => {
      groups.forEach(group => {
        if (group.length === 0) return;
        const attachments = group.map(rib => ribPoint(rib, x, airfoil(x).lower));
        const mean = attachments
          .reduce((sum, p) => sum.add(p), new THREE.Vector3())
          .divideScalar(attachments.length);
        const junction = riserTop.clone().lerp(mean, 0.55);
        attachments.forEach(p => line(p, junction));
        line(junction, riserTop);
      });
    });

    const hand = HANDS.clone().setZ(side * HANDS.z);
    const brakeRibs = halfRibs.filter(rib => Math.abs(rib.t) >= BRAKE_FROM);
    const trailingEdges = brakeRibs.map(rib => ribPoint(rib, 1, airfoil(1).lower));
    const mean = trailingEdges
      .reduce((sum, p) => sum.add(p), new THREE.Vector3())
      .divideScalar(Math.max(1, trailingEdges.length));
    const brakeJunction = hand.clone().lerp(mean, 0.6);
    trailingEdges.forEach(p => line(p, brakeJunction));
    line(brakeJunction, hand);
  });

  // Real lines are thin and dark: a hint of them reads at a distance, bright ones look like wires.
  const material = new THREE.LineBasicMaterial({
    color: options.lineColor,
    transparent: true,
    opacity: 0.3,
  });
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), material);
  lines.name = 'lines';
  return lines;
};

const createRisers = (): THREE.Group => {
  const risers = new THREE.Group();
  risers.name = 'risers';
  const material = new THREE.MeshLambertMaterial({ color: '#222222' });
  const geometry = new THREE.BoxGeometry(30, RISER_LENGTH, 12);
  [-1, 1].forEach(side => {
    const riser = new THREE.Mesh(geometry, material);
    riser.position.set(0, RISER_LENGTH / 2, side * CARABINER_HALF_GAP);
    risers.add(riser);
  });
  return risers;
};

class Glider {
  options: GliderOptions;

  constructor(options: GliderOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  async load(): Promise<THREE.Group> {
    const cells = this.options.numeroCajones ?? 40;
    const ribs = createRibs(cells);
    const wing = new THREE.Group();
    wing.name = 'glider';
    wing.add(createCanopy(ribs, this.options));
    wing.add(createLines(ribs, cells, this.options));
    wing.add(createRisers());
    return wing;
  }
}

export default Glider;
