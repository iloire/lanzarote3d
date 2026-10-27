import { crossing } from '../../src/shared/env/ferry';

describe('ferry crossing', () => {
  const travel = 100;
  const dwell = 20;

  it('sets off from the first harbour and arrives at the other', () => {
    expect(crossing(0, travel, dwell)).toEqual({ u: 0, outbound: true });
    expect(crossing(50, travel, dwell).u).toBeCloseTo(0.5);
    expect(crossing(100, travel, dwell).u).toBe(1);
  });

  it('waits alongside before turning back', () => {
    expect(crossing(110, travel, dwell)).toEqual({ u: 1, outbound: true });
    const back = crossing(170, travel, dwell);
    expect(back.outbound).toBe(false);
    expect(back.u).toBeCloseTo(0.5);
  });

  it('is home again after a full round trip, and keeps going', () => {
    expect(crossing(220, travel, dwell).u).toBe(0);
    expect(crossing(240, travel, dwell)).toEqual({ u: 0, outbound: true });
    expect(crossing(240 + 50, travel, dwell).u).toBeCloseTo(0.5);
  });

  it('eases away from the quay rather than leaving at full speed', () => {
    expect(crossing(5, travel, dwell).u).toBeLessThan(0.05 / 2);
  });
});
