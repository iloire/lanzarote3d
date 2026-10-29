import type { Tide } from '../../shared/env/tide';
import './tide-gauge.css';

/**
 * A small gauge above the place picker: how full the tide is, whether it's coming in or going
 * out, and the height of the water. Returns its update and a remover.
 */
export function createTideGauge(tide: Tide): {
  update: (seconds: number) => void;
  remove: () => void;
} {
  const root = document.createElement('div');
  root.className = 'tide-gauge';
  root.setAttribute('role', 'status');
  root.innerHTML =
    '<span>TIDE</span><span class="tide-gauge__bar"><span class="tide-gauge__fill"></span></span><span class="tide-gauge__state"></span>';
  document.body.appendChild(root);
  const fill = root.querySelector<HTMLElement>('.tide-gauge__fill')!;
  const state = root.querySelector<HTMLElement>('.tide-gauge__state')!;
  let shown = '';
  return {
    update: seconds => {
      const full = tide.fullness(seconds);
      const level = tide.level(seconds);
      const text = `${tide.rising(seconds) ? 'IN ▲' : 'OUT ▼'} ${level >= 0 ? '+' : ''}${level.toFixed(0)}M`;
      fill.style.width = `${(full * 100).toFixed(1)}%`;
      if (text !== shown) {
        state.textContent = text;
        shown = text;
      }
    },
    remove: () => root.remove(),
  };
}
