import { Tide } from '../../src/shared/env/tide';

describe('Tide', () => {
  // 100 s from low water to low water, rising for the first 40
  const tide = new Tide({ low: -6, high: 8, period: 100, flood: 0.4 });

  it('is at low water at the start of each period and high water when the flood ends', () => {
    expect(tide.level(0)).toBeCloseTo(-6);
    expect(tide.level(100)).toBeCloseTo(-6);
    expect(tide.level(40)).toBeCloseTo(8);
    expect(tide.level(-60)).toBeCloseTo(8);
  });

  it('comes in faster than it goes out', () => {
    // Half way up after 20 s of flood, half way down after 30 s of ebb
    expect(tide.level(20)).toBeCloseTo(1);
    expect(tide.level(70)).toBeCloseTo(1);
    expect(tide.rising(39)).toBe(true);
    expect(tide.rising(41)).toBe(false);
  });

  it('says how full it is', () => {
    expect(tide.fullness(0)).toBeCloseTo(0);
    expect(tide.fullness(40)).toBeCloseTo(1);
    expect(tide.fullness(70)).toBeCloseTo(0.5);
  });

  it('knows how long ago the ebb left a patch of sand', () => {
    const halfWay = tide.phase(20); // flood reaches 1 m here
    // Under water from the flood at 1 m until the ebb passes it again
    expect(tide.dryFor(1, Math.PI)).toBe(0);
    // Just after the ebb leaves 1 m it has been dry for no time, and longer as it falls
    const left = Math.PI * 2 - halfWay;
    expect(tide.dryFor(1, left + 0.1)).toBeCloseTo(0.1);
    // Through low water and the next flood until the water is back
    expect(tide.dryFor(1, 0.2)).toBeCloseTo(halfWay + 0.2);
    expect(tide.dryFor(1, halfWay + 0.01)).toBe(0);
    // Above high water it's always dry, below low water never
    expect(tide.dryFor(9, 1)).toBeCloseTo(Math.PI * 2);
    expect(tide.dryFor(-7, 1)).toBe(0);
  });

  it('counts the seconds to the next high water', () => {
    expect(tide.secondsUntil(Math.PI, 0)).toBeCloseTo(40);
    expect(tide.secondsUntil(Math.PI, 50)).toBeCloseTo(90);
    expect(tide.secondsUntil(0, 50)).toBeCloseTo(50);
  });
});
