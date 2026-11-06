import './wind-sound.css';

// Soft wind made in the browser, no audio files: brown noise, a low layer for the air moving
// and a band-passed layer for the breath of each gust, swelling and easing at random.
const VOLUME = 0.35;
const FADE_IN = 4;
const FADE_OUT = 1.5;
const NOISE_SECONDS = 6;
// A new gust every GUST_EVERY seconds, easing towards its strength over about GUST_EASE
const GUST_EVERY = 4;
const GUST_EASE = 2.5;
const BODY = { cutoff: 380, gain: [0.5, 0.9] };
const BREATH = { frequency: [280, 750], q: 0.9, gain: [0.08, 0.45] };
const STORAGE_KEY = 'relax-wind';

const between = ([low, high]: number[], amount: number) => low! + (high! - low!) * amount;

/** A few seconds of brown noise, the soft rumble of moving air, to loop */
function brownNoise(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * NOISE_SECONDS, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

class Wind {
  private readonly context = new AudioContext();
  private readonly master = this.context.createGain();
  private readonly bodyGain = this.context.createGain();
  private readonly breathGain = this.context.createGain();
  private readonly breathFilter = this.context.createBiquadFilter();
  private gusts: number | undefined;

  constructor() {
    const { context } = this;
    const noise = brownNoise(context);
    const source = (offset: number) => {
      const node = context.createBufferSource();
      node.buffer = noise;
      node.loop = true;
      node.start(0, offset);
      return node;
    };

    const bodyFilter = context.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.value = BODY.cutoff;
    source(0).connect(bodyFilter).connect(this.bodyGain).connect(this.master);

    this.breathFilter.type = 'bandpass';
    this.breathFilter.Q.value = BREATH.q;
    // Started half way through the loop, so the two layers don't move together
    source(NOISE_SECONDS / 2)
      .connect(this.breathFilter)
      .connect(this.breathGain)
      .connect(this.master);

    this.master.gain.value = 0;
    this.master.connect(context.destination);
    this.gust();
  }

  /** Ease the gust layer towards a new strength, its pitch rising as it strengthens */
  private gust(): void {
    const now = this.context.currentTime;
    const strength = Math.random() ** 1.5;
    this.breathGain.gain.setTargetAtTime(between(BREATH.gain, strength), now, GUST_EASE);
    this.breathFilter.frequency.setTargetAtTime(
      between(BREATH.frequency, strength),
      now,
      GUST_EASE
    );
    this.bodyGain.gain.setTargetAtTime(between(BODY.gain, Math.random()), now, GUST_EASE * 2);
  }

  async play(): Promise<void> {
    await this.context.resume();
    this.gusts ??= window.setInterval(() => this.gust(), GUST_EVERY * 1000);
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(VOLUME, now + FADE_IN);
  }

  stop(): void {
    window.clearInterval(this.gusts);
    this.gusts = undefined;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + FADE_OUT);
  }

  close(): void {
    window.clearInterval(this.gusts);
    void this.context.close();
  }
}

/**
 * A wind button in the corner. The wind is on unless the viewer turned it off last time; the
 * browser only lets it start after a click or key, so it fades in on the first one.
 */
export function createWindSound(): () => void {
  let wind: Wind | undefined;
  let on = localStorage.getItem(STORAGE_KEY) !== 'off';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'wind-sound';
  const show = () => {
    button.textContent = on ? 'WIND ~ ON' : 'WIND ~ OFF';
    button.setAttribute('aria-pressed', String(on));
  };
  show();
  document.body.appendChild(button);

  const apply = () => {
    if (on) {
      wind ??= new Wind();
      void wind.play();
    } else {
      wind?.stop();
    }
  };
  const stopWaiting = () => {
    window.removeEventListener('pointerdown', firstTouch);
    window.removeEventListener('keydown', firstTouch);
  };
  // The button's own press is left to its click, which decides for itself
  const firstTouch = (event: Event) => {
    if (event.target === button) return;
    stopWaiting();
    apply();
  };
  window.addEventListener('pointerdown', firstTouch);
  window.addEventListener('keydown', firstTouch);

  button.addEventListener('click', () => {
    stopWaiting();
    on = !on;
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    show();
    apply();
  });

  return () => {
    stopWaiting();
    wind?.close();
    button.remove();
  };
}
