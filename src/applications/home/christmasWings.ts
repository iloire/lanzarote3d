import type { GliderOptions, GliderPatch } from '../../foundation/components/vehicles';
import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';
import type { ParagliderVoxelConfig } from './config';

const RED = '#d42a2a';
const WHITE = '#f6f4ee';
const GREEN = '#1d7a3a';
const GOLD = '#f2c230';
const BLACK = '#161616';

/** Candy cane: white, with red stripes slanting across it from tip to tip */
const CANDY_CANE: Partial<GliderOptions> = {
  wingColor1: WHITE,
  wingColor2: WHITE,
  undersideColor: RED,
  inletsColor: RED,
  patches: Array.from(
    { length: 12 },
    (_, i): GliderPatch => ({
      color: RED,
      from: [-1.3 + i * 0.22, 0],
      to: [-1.1 + i * 0.22, 1],
      width: 0.05,
    })
  ),
};

/** A Christmas tree: green, a gold star on the nose, a gold garland and red and gold baubles */
const BAUBLES: [number, number, string][] = [
  [-0.8, 0.35, RED],
  [-0.45, 0.7, GOLD],
  [-0.2, 0.4, RED],
  [0.2, 0.75, RED],
  [0.45, 0.35, GOLD],
  [0.8, 0.65, RED],
];
const CHRISTMAS_TREE: Partial<GliderOptions> = {
  wingColor1: GREEN,
  wingColor2: GREEN,
  undersideColor: '#145a2a',
  inletsColor: GOLD,
  patches: [
    { color: GOLD, from: [0, 0.02], to: [0, 0.2], width: 0.07 },
    { color: GOLD, from: [-0.08, 0.1], to: [0.08, 0.1], width: 0.04 },
    ...BAUBLES.map(
      ([span, chord, color]): GliderPatch => ({
        color,
        from: [span, chord],
        to: [span, chord],
        width: 0.06,
      })
    ),
    { color: GOLD, from: [-1.1, 0.55], to: [-0.5, 0.45], width: 0.02 },
    { color: GOLD, from: [-0.5, 0.45], to: [0, 0.55], width: 0.02 },
    { color: GOLD, from: [0, 0.55], to: [0.5, 0.45], width: 0.02 },
    { color: GOLD, from: [0.5, 0.45], to: [1.1, 0.55], width: 0.02 },
  ],
};

/** Santa's suit: red, white fur along the leading edge, a black belt with a gold buckle */
const SANTA_SUIT: Partial<GliderOptions> = {
  wingColor1: RED,
  wingColor2: RED,
  undersideColor: WHITE,
  inletsColor: WHITE,
  // The first patch over a cell wins: the buckle's hole, then the buckle, then the belt
  patches: [
    { color: BLACK, from: [-0.03, 0.6], to: [0.03, 0.6], width: 0.03 },
    { color: GOLD, from: [-0.08, 0.6], to: [0.08, 0.6], width: 0.08 },
    { color: BLACK, from: [-1.1, 0.6], to: [1.1, 0.6], width: 0.06 },
    { color: WHITE, from: [-1.1, 0.06], to: [1.1, 0.06], width: 0.07 },
  ],
};

const DESIGNS = [SANTA_SUIT, CANDY_CANE, CHRISTMAS_TREE];

/**
 * At Christmas the pilots fly festive wings, the three designs taken in turn down the list, and
 * Magne, the best of them, the tree with the star. Each keeps its own wing's kind and cells, so
 * it flies as it always does; the stripes and advert go, the rest is repainted.
 */
export function withChristmasWings(pilots: ParagliderVoxelConfig[]): ParagliderVoxelConfig[] {
  return pilots.map((pilot, i) => {
    const { glider } = pilot.options;
    const design =
      pilot.options.pilot.characterType === CharacterType.MAGNE
        ? CHRISTMAS_TREE
        : DESIGNS[i % DESIGNS.length];
    return {
      ...pilot,
      options: {
        ...pilot.options,
        glider: {
          kind: glider.kind,
          numeroCajones: glider.numeroCajones,
          ...design,
        },
      },
    };
  });
}
