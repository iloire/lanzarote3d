// A fresh module per test: the scheduler keeps the last frame's time between calls.
type Frame = typeof import('../../src/foundation/systems/animation/frame');

/** Drives the given loops through vsyncs at `hz` and counts how often each one ran. */
function run(hz: number, vsyncs: number, loops: number): number[] {
  let queue: FrameRequestCallback[] = [];
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
    queue.push(cb);
    return queue.length;
  });
  let frame!: Frame;
  jest.isolateModules(() => {
    frame = require('../../src/foundation/systems/animation/frame');
  });
  const counts = new Array(loops).fill(0) as number[];
  counts.forEach((_, i) => {
    const loop = (): void => {
      counts[i]!++;
      frame.requestFrame(loop);
    };
    frame.requestFrame(loop);
  });
  for (let v = 0; v < vsyncs; v++) {
    const now = 1000 + (v * 1000) / hz;
    const due = queue;
    queue = [];
    due.forEach(cb => cb(now));
  }
  return counts;
}

afterEach(() => jest.restoreAllMocks());

describe('requestFrame', () => {
  it('runs every vsync at 60 Hz', () => {
    expect(run(60, 60, 1)).toEqual([60]);
  });

  it('runs every other vsync at 120 Hz, all loops on the same frames', () => {
    expect(run(120, 120, 3)).toEqual([60, 60, 60]);
  });

  it('holds close to 60 fps at 144 Hz', () => {
    const [count] = run(144, 144, 1);
    expect(count).toBeGreaterThanOrEqual(58);
    expect(count).toBeLessThanOrEqual(61);
  });

  it('cancels a pending frame', () => {
    const queue: FrameRequestCallback[] = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => queue.push(cb));
    const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    let frame!: Frame;
    jest.isolateModules(() => {
      frame = require('../../src/foundation/systems/animation/frame');
    });
    const handle = frame.requestFrame(() => {});
    frame.cancelFrame(handle);
    expect(cancel).toHaveBeenCalledWith(1);
  });
});
