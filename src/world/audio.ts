/** A quiet, self-contained music-box soundscape. Audio starts only after a user gesture. */
export class Soundscape {
  enabled = false;
  private context?: AudioContext;
  private master?: GainNode;
  private clock = 0;
  private nextNote = 0;
  private noteIndex = 0;
  private paused = false;
  private melody = [0, 4, 7, 9, 7, 4, 2, 0, 4, 7, 12, 9, 7, 4, 2, 4];

  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.context.destination);
      }
      await this.context.resume();
    }
    this.gain();
    return this.enabled;
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    this.gain();
  }
  private gain() {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        this.enabled && !this.paused ? 0.16 : 0,
        this.context.currentTime,
        0.3,
      );
  }
  note(semitone: number, velocity = 0.2, duration = 2.5) {
    if (!this.context || !this.master || !this.enabled || this.paused) return;
    const ctx = this.context,
      now = ctx.currentTime,
      hz = 261.63 * 2 ** (semitone / 12);
    for (const [multiple, level] of [
      [1, velocity],
      [2, velocity * 0.18],
    ]) {
      const oscillator = ctx.createOscillator(),
        envelope = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = hz * multiple;
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(level, now + 0.014);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(envelope);
      envelope.connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.1);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
    }
  }
  update(dt: number, playingMusic: boolean) {
    if (!this.enabled || this.paused) return;
    this.clock += dt;
    if (this.clock >= this.nextNote) {
      this.note(
        this.melody[this.noteIndex % this.melody.length] + (playingMusic ? 12 : 0),
        playingMusic ? 0.3 : 0.16,
      );
      if (this.noteIndex % 4 === 0)
        this.note(-12 + [0, 5, 7, 0][Math.floor(this.noteIndex / 4) % 4], 0.075, 4);
      this.noteIndex++;
      this.nextNote = this.clock + (playingMusic ? 0.48 : 0.83);
    }
  }
  dispose() {
    void this.context?.close();
  }
}
