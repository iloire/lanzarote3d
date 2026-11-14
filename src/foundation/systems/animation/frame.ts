/**
 * requestAnimationFrame capped at 60 fps.
 *
 * On a 120 Hz screen the browser calls back twice as often as the scenes need, doubling the
 * CPU spent stepping and drawing them. Every loop schedules through here, and one decision
 * per vsync timestamp keeps them all on the same frames: a vsync that comes too soon after
 * the last frame is passed over and the callback asks again for the next one.
 */

const FRAME_MS = 1000 / 60;
// Vsync timestamps jitter; a frame that comes a little early still counts.
const EARLY_MS = 2;

let lastFrame = -Infinity;
let decidedAt = -1;
let due = true;

const isDue = (now: number): boolean => {
  if (now === decidedAt) return due;
  decidedAt = now;
  due = now - lastFrame >= FRAME_MS - EARLY_MS;
  if (due) {
    // Step by whole frames so the rate holds at 60 on any refresh, but never fall behind now.
    lastFrame = now - lastFrame > 2 * FRAME_MS ? now : lastFrame + FRAME_MS;
  }
  return due;
};

let nextHandle = 1;
const pending = new Map<number, number>();

export function requestFrame(callback: FrameRequestCallback): number {
  const handle = nextHandle++;
  const tick = (now: number): void => {
    if (isDue(now)) {
      pending.delete(handle);
      callback(now);
    } else {
      pending.set(handle, requestAnimationFrame(tick));
    }
  };
  pending.set(handle, requestAnimationFrame(tick));
  return handle;
}

export function cancelFrame(handle: number): void {
  const id = pending.get(handle);
  if (id === undefined) return;
  cancelAnimationFrame(id);
  pending.delete(handle);
}
