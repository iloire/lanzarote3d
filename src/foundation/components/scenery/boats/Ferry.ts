import * as THREE from 'three';
import { MeshBuilder, lowPolyMaterial, ring } from '../../base/lowPolyMesh';
import {
  ANTIFOULING,
  STAINLESS,
  Station,
  WINDOWED,
  SEG_WINDOWS,
  buildHull,
  hullAt,
} from './lowPolyHull';

const WHITE = new THREE.Color('#F4F4F0');
const BLUE = new THREE.Color('#1E5AA8');
const DECK = new THREE.Color('#B8B2A6');
const GLASS = new THREE.Color('#1F2937');
const FUNNEL = new THREE.Color('#2B3440');

// Stern to bow: a 32 m passenger ferry, full-bodied aft with a fine, raised bow
const STATIONS: Station[] = [
  { x: -16, deck: 2.4, keel: -1.2, beam: 4.2 },
  { x: -8, deck: 2.4, keel: -1.6, beam: 4.4 },
  { x: 6, deck: 2.5, keel: -1.6, beam: 4.3 },
  { x: 12, deck: 2.9, keel: -1.0, beam: 3.1 },
  { x: 16, deck: 3.5, keel: 0.4, beam: 0.2 },
];

/**
 * The little ferry that crosses El Río from Órzola to Caleta de Sebo on La Graciosa: a blue hull
 * with a white sheer, a long saloon with a band of windows, a bridge deck above it with an open
 * sun deck aft behind rails, a radar mast and twin exhausts. One vertex-coloured mesh, its bow
 * along −z (the quarter turn the boats share), so the boat wake fits it.
 */
export const createFerry = (): THREE.Mesh => {
  const mesh = new MeshBuilder();
  const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
  buildHull(mesh, STATIONS, {
    sheer: WHITE,
    topside: BLUE,
    boot: WHITE,
    bottom: ANTIFOULING,
    deck: DECK,
  });

  // Main saloon, its front raked, a band of windows all along
  mesh.loft(
    [
      ring(-13, 2.4, 5.6, 3.9, 0, WINDOWED),
      ring(7, 2.5, 5.6, 3.8, 0, WINDOWED),
      ring(10, 2.8, 5.0, 3.0, 0, WINDOWED),
    ],
    (_, k) => (SEG_WINDOWS.includes(k) ? GLASS : WHITE),
    [WHITE, GLASS]
  );
  mesh.box(-13.4, 10.4, 5.6, 5.85, 4.1, 0, WHITE);

  // Bridge deck above, raked forward, with the wheelhouse windows
  mesh.loft(
    [
      ring(-4, 5.85, 8.2, 3.0, 0, WINDOWED),
      ring(5, 5.85, 8.2, 2.9, 0, WINDOWED),
      ring(7, 5.85, 7.6, 2.4, 0, WINDOWED),
    ],
    (_, k) => (SEG_WINDOWS.includes(k) ? GLASS : WHITE),
    [WHITE, GLASS]
  );
  mesh.box(-4.3, 7.4, 8.2, 8.4, 3.2, 0, BLUE);

  // Sun deck rails aft on the saloon roof
  [-1, 1].forEach(side => {
    const posts = [-13, -10, -7, -4].map(x => {
      const top = v(x, 6.9, side * 3.8);
      mesh.rod(v(x, 5.85, side * 3.8), top, 0.06, STAINLESS, 3);
      return top;
    });
    posts.forEach((p, i) => i > 0 && mesh.rod(posts[i - 1]!, p, 0.06, STAINLESS, 3));
  });
  mesh.rod(v(-13, 6.9, -3.8), v(-13, 6.9, 3.8), 0.06, STAINLESS, 3);

  // Radar mast, and the twin exhausts behind the bridge
  mesh.rod(v(2, 8.4), v(2, 11.5), 0.12, STAINLESS);
  mesh.box(1.4, 2.6, 10.2, 10.35, 1.1, 0, GLASS);
  [-1.6, 1.6].forEach(z => mesh.box(-5.4, -4.4, 8.2, 9.6, 0.4, z, FUNNEL));

  // Bow and stern bulwarks, so the open decks have an edge
  const bow = hullAt(STATIONS, 12);
  [-1, 1].forEach(side =>
    mesh.quad(
      v(10.4, hullAt(STATIONS, 10.4).deck, side * hullAt(STATIONS, 10.4).beam),
      v(12, bow.deck, side * bow.beam),
      v(12, bow.deck + 0.8, side * bow.beam),
      v(10.4, hullAt(STATIONS, 10.4).deck + 0.8, side * hullAt(STATIONS, 10.4).beam),
      WHITE
    )
  );

  const ferry = new THREE.Mesh(mesh.build(), lowPolyMaterial());
  ferry.name = 'Ferry';
  // Bow from +X round to −z, as the other boats
  ferry.rotateY(Math.PI / 2);
  return ferry;
};
