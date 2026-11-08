// A small, friendly paramotor engine made in the browser, no audio files: a soft putt-putt like a
// toy scooter heard from a distance, rather than the real two-stroke roar. A rounded pulse at the
// firing rate, an octave-up hum, and a slow wander in pitch as the throttle breathes.
const VOLUME = 0.12;
const FADE_IN = 4;
const FADE_OUT = 1.5;
// Firing pulses a second, and how far the throttle wanders either side of it
const FIRING = 38;
const WANDER = 3;
const WANDER_EVERY = 3;
const WANDER_EASE = 1.5;
// Low-passed so the pulse stays round and puttering, never buzzy
const CUTOFF = 520;
const HUM = { ratio: 2, gain: 0.25 };
// How deeply each firing pulses the sound, for the putt-putt
const PUTT = 0.6;

export class Engine {
  private readonly context = new AudioContext();
  private readonly master = this.context.createGain();
  private readonly pulse = this.context.createOscillator();
  private readonly hum = this.context.createOscillator();
  private readonly putt = this.context.createOscillator();
  private wander: number | undefined;

  constructor() {
    const { context } = this;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = CUTOFF;
    filter.Q.value = 0.7;

    this.pulse.type = 'sawtooth';
    this.hum.type = 'triangle';
    const humGain = context.createGain();
    humGain.gain.value = HUM.gain;

    // The putt: an oscillator at the firing rate swings the body's volume up and down
    const body = context.createGain();
    body.gain.value = 1 - PUTT / 2;
    this.putt.type = 'sine';
    const puttDepth = context.createGain();
    puttDepth.gain.value = PUTT / 2;
    this.putt.connect(puttDepth).connect(body.gain);

    this.pulse.connect(filter);
    this.hum.connect(humGain).connect(filter);
    filter.connect(body).connect(this.master);
    this.setFiring(FIRING, 0);
    [this.pulse, this.hum, this.putt].forEach(node => node.start());

    this.master.gain.value = 0;
    this.master.connect(context.destination);
  }

  /** Every voice follows the firing rate, so the putt stays in step with the pitch */
  private setFiring(rate: number, ease: number): void {
    const now = this.context.currentTime;
    const set = (param: AudioParam, value: number) =>
      ease ? param.setTargetAtTime(value, now, ease) : param.setValueAtTime(value, now);
    set(this.pulse.frequency, rate * 2);
    set(this.hum.frequency, rate * 2 * HUM.ratio);
    set(this.putt.frequency, rate);
  }

  async play(): Promise<void> {
    await this.context.resume();
    this.wander ??= window.setInterval(
      () => this.setFiring(FIRING + (Math.random() * 2 - 1) * WANDER, WANDER_EASE),
      WANDER_EVERY * 1000
    );
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(VOLUME, now + FADE_IN);
  }

  stop(): void {
    window.clearInterval(this.wander);
    this.wander = undefined;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + FADE_OUT);
  }

  close(): void {
    window.clearInterval(this.wander);
    void this.context.close();
  }
}
