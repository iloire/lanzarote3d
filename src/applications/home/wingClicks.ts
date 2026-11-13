import * as THREE from 'three';
import type { ParagliderMotion } from './paragliderMotion';

/** How far the pointer may move, in pixels, and for how long, in ms, and still be a click */
const CLICK_SLOP = 6;
const CLICK_TIME = 400;

/**
 * Calls `onClick` for a click on the canvas, not a drag of the camera. Returns how to stop.
 */
export function listenForClicks(
  canvas: HTMLCanvasElement,
  onClick: (event: PointerEvent) => void
): () => void {
  let down: { x: number; y: number; time: number } | null = null;
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, time: e.timeStamp };
  };
  const onUp = (e: PointerEvent) => {
    const click =
      down &&
      Math.hypot(e.clientX - down.x, e.clientY - down.y) < CLICK_SLOP &&
      e.timeStamp - down.time < CLICK_TIME;
    down = null;
    if (click) onClick(e);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
  };
}

/**
 * A click on a paraglider's wing collapses the tip on that side, which then reopens. Returns how
 * to stop listening.
 */
export function listenForWingClicks(
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  gliders: { mesh: THREE.Object3D; motion?: ParagliderMotion }[]
): () => void {
  const motions = new Map<THREE.Object3D, ParagliderMotion>();
  gliders.forEach(({ mesh, motion }) => {
    const canopy = mesh.getObjectByName('canopy');
    if (canopy && motion?.collapsible) motions.set(canopy, motion);
  });
  if (motions.size === 0) return () => {};

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const canopies = [...motions.keys()];
  return listenForClicks(canvas, e => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(canopies, false)[0];
    if (!hit) return;
    motions.get(hit.object)?.collapseAt(hit.point);
    window.gtag?.('event', 'wing_collapse', {});
  });
}
