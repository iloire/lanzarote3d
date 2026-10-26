import { chamferDistance } from '../../src/foundation/rendering/CoastField';

// RGBA buffer, white where `land` returns true.
const mask = (width: number, height: number, land: (x: number, y: number) => boolean) => {
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      rgba[(y * width + x) * 4] = land(x, y) ? 255 : 0;
    }
  }
  return rgba;
};

describe('chamferDistance', () => {
  it('is zero on land and counts texels out to sea along the axes', () => {
    const d = chamferDistance(
      mask(9, 1, x => x === 0),
      9,
      1
    );
    expect(Array.from(d)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('reaches sea on both sides of the land (both passes run)', () => {
    const d = chamferDistance(
      mask(7, 1, x => x === 3),
      7,
      1
    );
    expect(Array.from(d)).toEqual([3, 2, 1, 0, 1, 2, 3]);
  });

  it('approximates diagonal distance within the 3-4 chamfer error', () => {
    const size = 21;
    const d = chamferDistance(
      mask(size, size, (x, y) => x === 10 && y === 10),
      size,
      size
    );
    const diagonal = d[20 * size + 20]!;
    expect(diagonal).toBeGreaterThan(Math.hypot(10, 10) * 0.92);
    expect(diagonal).toBeLessThan(Math.hypot(10, 10) * 1.08);
  });

  it('measures the distance to the nearest of several coasts', () => {
    const d = chamferDistance(
      mask(11, 1, x => x === 0 || x === 10),
      11,
      1
    );
    expect(d[5]).toBe(5);
    expect(d[8]).toBe(2);
  });
});
