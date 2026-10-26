import { setSharedWind, sharedUniforms } from '../../src/foundation/rendering/sharedUniforms';
import { Easing } from '../../src/foundation/systems/animation/SimpleAnimator';

describe('setSharedWind', () => {
  it('turns "wind from" degrees into the direction the air moves', () => {
    // A northerly blows towards the south, which is +z in the island model.
    setSharedWind(0, 10);
    expect(sharedUniforms.uWind.value.x).toBeCloseTo(0);
    expect(sharedUniforms.uWind.value.y).toBeCloseTo(10);

    // A westerly (Famara's 280° is nearly one) blows towards the east, +x.
    setSharedWind(270, 5);
    expect(sharedUniforms.uWind.value.x).toBeCloseTo(5);
    expect(sharedUniforms.uWind.value.y).toBeCloseTo(0);
  });
});

describe('Easing.approach', () => {
  const speed = (t: number) => (Easing.approach(t + 1e-4) - Easing.approach(t - 1e-4)) / 2e-4;

  it('runs from 0 to 1, starting and ending at rest', () => {
    expect(Easing.approach(0)).toBe(0);
    expect(Easing.approach(1)).toBe(1);
    expect(speed(1e-4)).toBeCloseTo(0, 2);
    expect(speed(1 - 1e-4)).toBeCloseTo(0, 2);
  });

  it('is fastest a third of the way in and never goes backwards', () => {
    expect(speed(1 / 3)).toBeGreaterThan(speed(0.2));
    expect(speed(1 / 3)).toBeGreaterThan(speed(0.5));
    for (let t = 0.01; t < 1; t += 0.01) {
      expect(speed(t)).toBeGreaterThanOrEqual(0);
    }
  });
});
