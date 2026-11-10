// Sleigh bells made in the browser, no audio files: each jingle is a handful of small bells, a
// few inharmonic partials each that ring and die away, over a short hiss of the shake. They come
// in pairs at a trot, a strong shake then a lighter one, as if a harness were bouncing.
const VOLUME = 0.22;
const FADE_IN = 3;
const FADE_OUT = 1.5;
/** Shakes a second, and how much the timing wanders so it never sounds like a machine */
const TROT = 2.6;
const LOOSE = 0.03;
/** Bells per shake, and the range their fundamentals are drawn from, in hertz */
const BELLS = 4;
const PITCH = [2300, 3900];
/** A bell's partials, as multiples of its fundamental: a small bell's bright, clangy ring */
const PARTIALS = [1, 2.76, 5.4];
const RING = 0.35;
/** Full volume within `near` metres of the camera, silent beyond `far` */
const NEAR = 250;
const FAR = 1800;
/** How far ahead (seconds) the shakes are scheduled, and how often the scheduler wakes */
const AHEAD = 0.3;
const TICK = 100;

export class SleighBells {
  private readonly context = new AudioContext();
  private readonly master = this.context.createGain();
  /** Follows the distance to the sleigh, under the master's fades */
  private readonly nearness = this.context.createGain();
  private readonly hiss: AudioBuffer;
  private next = 0;
  private beat = 0;
  private timer: number | undefined;

  constructor() {
    const { context } = this;
    this.hiss = context.createBuffer(1, context.sampleRate * 0.08, context.sampleRate);
    const data = this.hiss.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.master.gain.value = 0;
    this.nearness.gain.value = 0;
    this.nearness.connect(this.master).connect(context.destination);
  }

  async play(): Promise<void> {
    await this.context.resume();
    this.fadeTo(VOLUME, FADE_IN);
    if (this.timer !== undefined) return;
    this.next = this.context.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), TICK);
  }

  stop(): void {
    this.fadeTo(0, FADE_OUT);
  }

  close(): void {
    window.clearInterval(this.timer);
    void this.context.close();
  }

  /** How far the sleigh is from the listener, in metres */
  setDistance(metres: number): void {
    const near = 1 - Math.min(1, Math.max(0, (metres - NEAR) / (FAR - NEAR)));
    this.nearness.gain.setTargetAtTime(near * near, this.context.currentTime, 0.3);
  }

  private schedule(): void {
    const { context } = this;
    // Nothing to hear while faded out or out of earshot; keep time without making sound
    const audible = this.master.gain.value > 0.001 && this.nearness.gain.value > 0.001;
    while (this.next < context.currentTime + AHEAD) {
      if (audible) this.shake(this.next, this.beat % 2 === 0 ? 1 : 0.55);
      this.beat++;
      this.next += (1 / TROT) * (1 + (Math.random() * 2 - 1) * LOOSE);
    }
  }

  /** One shake of the harness at `time`: a hiss and a few bells, `strength` 0-1 */
  private shake(time: number, strength: number): void {
    const { context } = this;
    const hiss = context.createBufferSource();
    hiss.buffer = this.hiss;
    const band = context.createBiquadFilter();
    band.type = 'highpass';
    band.frequency.value = 6000;
    const hissGain = context.createGain();
    hissGain.gain.setValueAtTime(0.25 * strength, time);
    hissGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    hiss.connect(band).connect(hissGain).connect(this.nearness);
    hiss.start(time);

    for (let b = 0; b < BELLS; b++) {
      const at = time + Math.random() * 0.04;
      const pitch = PITCH[0]! + Math.random() * (PITCH[1]! - PITCH[0]!);
      PARTIALS.forEach((ratio, i) => {
        const tone = context.createOscillator();
        tone.frequency.value = pitch * ratio;
        const gain = context.createGain();
        const level = (strength * 0.12) / (i + 1) / BELLS;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(level, at + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + RING / (i + 1));
        tone.connect(gain).connect(this.nearness);
        tone.start(at);
        tone.stop(at + RING + 0.05);
      });
    }
  }

  private fadeTo(volume: number, seconds: number): void {
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(volume, now + seconds);
  }
}
