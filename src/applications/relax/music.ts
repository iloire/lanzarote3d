// Calm tracks by Kevin MacLeod (incompetech.com), CC BY 4.0, re-encoded at 96 kbps. They play
// one after another from a random start, quietly under the wind.
const TRACKS = ['meditation-impromptu-01', 'dreamer', 'floating-cities'].map(
  name => `/assets/relax/music/${name}.mp3`
);
const VOLUME = 0.3;
const FADE_IN = 5;
const FADE_OUT = 1.5;

export class Music {
  private readonly context = new AudioContext();
  private readonly gain = this.context.createGain();
  private readonly audio = new Audio();
  private track = Math.floor(Math.random() * TRACKS.length);
  private pausing: number | undefined;

  constructor() {
    this.audio.src = TRACKS[this.track]!;
    this.audio.addEventListener('ended', () => {
      this.track = (this.track + 1) % TRACKS.length;
      this.audio.src = TRACKS[this.track]!;
      void this.audio.play();
    });
    this.gain.gain.value = 0;
    this.context
      .createMediaElementSource(this.audio)
      .connect(this.gain)
      .connect(this.context.destination);
  }

  async play(): Promise<void> {
    window.clearTimeout(this.pausing);
    await this.context.resume();
    await this.audio.play();
    this.fadeTo(VOLUME, FADE_IN);
  }

  stop(): void {
    this.fadeTo(0, FADE_OUT);
    window.clearTimeout(this.pausing);
    this.pausing = window.setTimeout(() => this.audio.pause(), FADE_OUT * 1000);
  }

  close(): void {
    window.clearTimeout(this.pausing);
    this.audio.pause();
    void this.context.close();
  }

  private fadeTo(volume: number, seconds: number): void {
    const now = this.context.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(this.gain.gain.value, now);
    this.gain.gain.linearRampToValueAtTime(volume, now + seconds);
  }
}
