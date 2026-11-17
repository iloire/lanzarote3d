import * as THREE from 'three';
import { FlyingZone, windBearing } from './zones';

// Pins whose ground points land closer than this on screen, in pixels, are pushed apart
// sideways (Mirador and Órzola are a kilometre apart), each label turning away from the other
const MIN_GAP = 76;
// Where a pin's label may go, tried in turn for the first that clears the labels and wings already laid
// out: right or left of its wing, on a stem this many px tall
const STEMS = [26, 64, 102];
// The wing's box over the top of the stem, and the label's offset from the stem and above its top
const WING = { width: 56, height: 44 };
const LABEL_SIDE = 30;
const LABEL_LIFT = 10;
// Half the room a takeoff dot and its ring keep clear, px
const SPOT = 9;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** How much covering it costs: a takeoff dot or the screen's edge far more than a label */
  weight?: number;
}

/** How many square px two boxes share */
const overlap = (a: Box, b: Box): number =>
  (b.weight ?? 1) *
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/** A canopy in the zone's colour, its cells, the lines and the pilot hanging under it */
const wing = (color: string): string => `
  <svg class="zone-pin__wing" viewBox="0 0 56 44" aria-hidden="true">
    <g class="zone-pin__lines" stroke="currentColor" stroke-width="0.8" fill="none">
      <path d="M8 17 L28 34 M18 12 L28 34 M38 12 L28 34 M48 17 L28 34" />
    </g>
    <path d="M3 16 Q28 -4 53 16 L48 19.5 Q28 4 8 19.5 Z" fill="${color}" />
    <path d="M3 16 Q28 -4 53 16" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1.4" />
    <g stroke="#000" stroke-opacity="0.18" stroke-width="0.9">
      <path d="M13.5 9 L16 15 M22 5.5 L23 12 M34 5.5 L33 12 M42.5 9 L40 15" />
    </g>
    <circle cx="28" cy="35.5" r="3.6" fill="#0e2233" />
    <circle cx="28" cy="34.2" r="2.4" fill="${color}" />
    <path d="M25 38.5 h6 l-1 4 h-4 z" fill="#0e2233" />
  </svg>`;

interface Pin {
  zone: FlyingZone;
  element: HTMLAnchorElement;
  ground: THREE.Vector3;
}

/**
 * The flying zones as pins over the scene: a little paraglider on a stem from its takeoff, with
 * its name and the wind it works in, each a link to the zone's scene. `place` lays them out on
 * the camera's view every frame.
 */
export class ZoneMarkers {
  readonly root: HTMLElement;
  private pins: Pin[];
  private projected = new THREE.Vector3();

  constructor(
    zones: { zone: FlyingZone; ground: THREE.Vector3; href: string }[],
    parent: HTMLElement = document.body
  ) {
    this.root = document.createElement('nav');
    this.root.className = 'zone-pins';
    this.root.setAttribute('aria-label', 'Flying zones');
    // West to east, so they land along the island one after another
    const order = [...zones].sort((a, b) => a.ground.x - b.ground.x);
    this.pins = order.map(({ zone, ground, href }, i) => {
      const element = document.createElement('a');
      element.className = 'zone-pin';
      element.href = href;
      element.style.setProperty('--wing', zone.color);
      element.style.setProperty('--i', String(i));
      const bearing = windBearing(zone.wind);
      if (bearing !== undefined) element.style.setProperty('--wind', `${bearing}deg`);
      element.innerHTML = `
        <span class="zone-pin__spot" aria-hidden="true"></span>
        <span class="zone-pin__float">
          <span class="zone-pin__stem" aria-hidden="true"></span>
          <span class="zone-pin__bob">${wing(zone.color)}</span>
          <span class="zone-pin__label">
            <span class="zone-pin__name">${zone.name}</span>
            <span class="zone-pin__meta">
              ${bearing === undefined ? '' : '<span class="zone-pin__arrow" aria-hidden="true">↓</span>'}
              <span>${bearing === undefined ? 'Any light wind' : `${zone.wind} wind`} · ${zone.altitude}</span>
            </span>
          </span>
        </span>`;
      return { zone, element, ground };
    });
    this.pins.forEach(({ element }) => this.root.appendChild(element));
    parent.appendChild(this.root);
  }

  /** Put every pin over its takeoff as `camera` sees it, north turned `heading` radians */
  place(camera: THREE.Camera, heading: number): void {
    const { innerWidth: width, innerHeight: height } = window;
    this.root.style.setProperty('--heading', `${THREE.MathUtils.radToDeg(heading)}deg`);
    const spots = this.pins.map(({ ground }) => {
      this.projected.copy(ground).project(camera);
      return {
        x: ((this.projected.x + 1) / 2) * width,
        y: ((1 - this.projected.y) / 2) * height,
        visible: this.projected.z < 1,
        shift: 0,
      };
    });
    // Push near neighbours apart along the screen's width, half the overlap each
    spots.forEach((a, i) =>
      spots.slice(i + 1).forEach(b => {
        const gap = Math.hypot(b.x - a.x, b.y - a.y);
        if (gap >= MIN_GAP || !a.visible || !b.visible) return;
        const push = (MIN_GAP - gap) / 2;
        const sign = b.x >= a.x ? 1 : -1;
        a.shift -= push * sign;
        b.shift += push * sign;
      })
    );
    // Read every label's size before writing any style, so the page lays out once a frame
    const sizes = this.pins.map(({ element }) => {
      const label = element.querySelector<HTMLElement>('.zone-pin__label')!;
      return { width: label.offsetWidth, height: label.offsetHeight };
    });
    // Labels keep off every takeoff dot and inside the screen, as well as off each other
    const beyond = Math.max(width, height);
    const taken: Box[] = [
      ...spots
        .filter(({ visible }) => visible)
        .map(({ x, y }) => ({ left: x - SPOT, right: x + SPOT, top: y - SPOT, bottom: y + SPOT })),
      { left: -beyond, right: 0, top: -beyond, bottom: 2 * beyond },
      { left: width, right: width + beyond, top: -beyond, bottom: 2 * beyond },
      { left: -beyond, right: 2 * beyond, top: -beyond, bottom: 0 },
    ].map(box => ({ ...box, weight: 20 }));
    this.pins.forEach(({ element }, i) => {
      const { x, y, visible, shift } = spots[i]!;
      const size = sizes[i]!;
      const centre = x + shift;
      const options = STEMS.flatMap(stem =>
        (shift < 0 ? [-1, 1] : [1, -1]).map(side => {
          const wing = {
            left: centre - WING.width / 2,
            right: centre + WING.width / 2,
            top: y - stem - WING.height,
            bottom: y - stem,
          };
          const near = centre + side * LABEL_SIDE;
          const label = {
            left: side > 0 ? near : near - size.width,
            right: side > 0 ? near + size.width : near,
            top: y - stem - LABEL_LIFT - size.height,
            bottom: y - stem - LABEL_LIFT,
          };
          return { stem, side, boxes: [wing, label] };
        })
      );
      // The first that clears everything, or else the one that covers least
      const covered = (boxes: Box[]) =>
        boxes.reduce(
          (sum, box) => sum + taken.reduce((area, other) => area + overlap(box, other), 0),
          0
        );
      const { stem, side, boxes } = options.reduce((best, option) =>
        covered(option.boxes) < covered(best.boxes) ? option : best
      );
      if (visible) taken.push(...boxes);
      element.hidden = !visible;
      element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      element.style.setProperty('--stem', `${stem}px`);
      element.style.setProperty('--shift', `${shift.toFixed(1)}px`);
      element.style.setProperty('--lean', `${Math.atan2(shift, stem).toFixed(3)}rad`);
      element.style.setProperty('--reach', `${Math.hypot(shift, stem).toFixed(1)}px`);
      element.classList.toggle('zone-pin--left', side < 0);
    });
  }

  dispose(): void {
    this.root.remove();
  }
}
