import { Engine } from './engine';
import { Music } from './music';
import { Wind } from './wind';
import './sound-controls.css';

interface Sound {
  play(): Promise<void>;
  stop(): void;
  close(): void;
}

interface SoundToggle {
  button: HTMLButtonElement;
  /** Start it if it's on: the browser allows sound only from a click or key */
  wake: () => void;
  close: () => void;
}

/** A round button that turns a sound on and off and remembers which, on unless turned off before */
function soundToggle(
  label: string,
  icon: string,
  storageKey: string,
  create: () => Sound,
  changed: (on: boolean) => void
): SoundToggle {
  let sound: Sound | undefined;
  let on = localStorage.getItem(storageKey) !== 'off';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sound-controls__toggle';
  button.textContent = icon;
  const show = () => {
    const name = `${label[0]}${label.slice(1).toLowerCase()}`;
    button.title = `${name} ${on ? 'on' : 'off'}`;
    button.setAttribute('aria-label', name);
    button.setAttribute('aria-pressed', String(on));
    changed(on);
  };
  const apply = () => {
    if (on) {
      sound ??= create();
      void sound.play();
    } else {
      sound?.stop();
    }
  };
  button.addEventListener('click', () => {
    on = !on;
    window.gtag?.('event', 'relax_sound_toggle', {
      sound: label.toLowerCase(),
      state: on ? 'on' : 'off',
    });
    localStorage.setItem(storageKey, on ? 'on' : 'off');
    show();
    apply();
  });
  show();
  return { button, wake: apply, close: () => sound?.close() };
}

/**
 * Round wind and music buttons in the top right corner, with the music's credit. A paramotor place
 * plays a soft engine instead of the wind. Both are on unless the viewer turned them off last
 * time, and fade in at the first click or key, since the browser blocks sound until then.
 * Returns a remover.
 */
export function createSoundControls(paramotor = false): () => void {
  const root = document.createElement('div');
  root.className = 'sound-controls';
  const credit = document.createElement('a');
  credit.className = 'sound-controls__credit';
  credit.href = 'https://incompetech.com';
  credit.target = '_blank';
  credit.rel = 'noopener';
  credit.addEventListener('click', () => window.gtag?.('event', 'relax_music_credit_click', {}));
  credit.textContent = 'MUSIC: KEVIN MACLEOD · CC BY 4.0';

  const toggles = [
    paramotor
      ? soundToggle(
          'ENGINE',
          '🛵',
          'relax-engine',
          () => new Engine(),
          () => {}
        )
      : soundToggle(
          'WIND',
          '🌬️',
          'relax-wind',
          () => new Wind(),
          () => {}
        ),
    soundToggle(
      'MUSIC',
      '🎵',
      'relax-music',
      () => new Music(),
      on => {
        credit.hidden = !on;
      }
    ),
  ];
  const buttons = document.createElement('div');
  buttons.className = 'sound-controls__buttons';
  buttons.append(...toggles.map(({ button }) => button));
  root.append(buttons, credit);
  document.body.appendChild(root);

  const stopWaiting = () => {
    window.removeEventListener('pointerdown', firstTouch);
    window.removeEventListener('keydown', firstTouch);
  };
  // A pressed toggle is left to its own click, which decides for itself
  const firstTouch = (event: Event) => {
    stopWaiting();
    toggles.filter(({ button }) => button !== event.target).forEach(({ wake }) => wake());
  };
  window.addEventListener('pointerdown', firstTouch);
  window.addEventListener('keydown', firstTouch);

  return () => {
    stopWaiting();
    toggles.forEach(({ close }) => close());
    root.remove();
  };
}
