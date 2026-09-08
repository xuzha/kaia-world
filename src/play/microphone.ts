export class MicrophoneBlower {
  state: 'off' | 'requesting' | 'on' = 'off';
  level = 0;
  message = 'Tap bubbles to pop them. The mic measures volume only; it never records.';
  private generation = 0;
  private stream?: MediaStream;
  private context?: AudioContext;
  private source?: MediaStreamAudioSourceNode;
  private analyser?: AnalyserNode;
  private samples = new Uint8Array(512);
  private cooldown = 0;

  constructor(
    private onChange: () => void,
    private onBlow: (strength: number) => void,
  ) {}

  async start() {
    if (this.state !== 'off') return;
    const generation = ++this.generation;
    this.state = 'requesting';
    this.message =
      'Allow microphone access, then blow gently. You can also tap the button anytime.';
    this.onChange();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unavailable');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      // The user can leave while the browser permission prompt is still open.
      if (generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      const context = new AudioContext();
      this.context = context;
      await context.resume();
      if (generation !== this.generation) return;
      this.source = context.createMediaStreamSource(stream);
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = 512;
      this.source.connect(this.analyser);
      for (const track of stream.getTracks())
        track.addEventListener('ended', () => {
          if (generation === this.generation)
            this.stop('The microphone disconnected. Tap the button to keep blowing bubbles.');
        });
      this.state = 'on';
      this.message = 'Blow gently into your mic. It measures volume only and never records.';
      this.onChange();
    } catch {
      if (generation === this.generation)
        this.stop('Couldn’t open the microphone. Tap “Blow bubbles” to keep playing.');
    }
  }

  update(dt: number) {
    if (this.state !== 'on' || !this.analyser) return;
    this.analyser.getByteTimeDomainData(this.samples);
    let energy = 0;
    for (const sample of this.samples) energy += ((sample - 128) / 128) ** 2;
    const rms = Math.sqrt(energy / this.samples.length);
    this.level += (Math.min(1, rms * 5) - this.level) * Math.min(1, dt * 12);
    this.cooldown -= dt;
    if (rms > 0.045 && this.cooldown <= 0) {
      this.onBlow(Math.min(1, rms * 4));
      this.cooldown = 0.22;
    }
  }

  stop(message = 'The microphone is off. You can still tap the button to blow bubbles.') {
    this.generation++;
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    if (this.context) void this.context.close().catch(() => {});
    this.stream = undefined;
    this.context = undefined;
    this.source = undefined;
    this.analyser = undefined;
    this.state = 'off';
    this.level = 0;
    this.cooldown = 0;
    this.message = message;
    this.onChange();
  }
}
