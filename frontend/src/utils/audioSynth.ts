/**
 * Web Audio API Sound Synthesizer Fallback for Call Ringtone & Dialtone
 * Guarantees zero network latency and 100% offline audio playback for calls.
 */
class CallSoundSynthesizer {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;

  private getContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  playRingtone() {
    this.stop();
    try {
      const ctx = this.getContext();
      const playBeep = () => {
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.8);
        osc2.stop(ctx.currentTime + 1.8);
      };

      playBeep();
      this.intervalId = setInterval(playBeep, 3000);
    } catch (e) {
      console.warn("Synthesizer playback warning:", e);
    }
  }

  playDialtone() {
    this.stop();
    try {
      const ctx = this.getContext();
      const playBeep = () => {
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(350, ctx.currentTime);
        osc2.frequency.setValueAtTime(440, ctx.currentTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.0);
        osc2.stop(ctx.currentTime + 1.0);
      };

      playBeep();
      this.intervalId = setInterval(playBeep, 2500);
    } catch (e) {
      console.warn("Synthesizer dialtone warning:", e);
    }
  }

  playNotificationChime() {
    try {
      const ctx = this.getContext();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Synthesizer notification chime warning:", e);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx && this.audioCtx.state === "running") {
      this.audioCtx.suspend().catch(() => {});
    }
  }
}

export const soundSynth = new CallSoundSynthesizer();
