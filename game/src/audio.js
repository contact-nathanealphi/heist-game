// Tiny synthesized sound effects, made with the Web Audio API — no audio files, no
// network. Everything is a short oscillator blip, started only after the player has
// pressed a key or clicked, so browsers allow it.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function blip(frequency, seconds, type, gainValue, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(gainValue, ctx.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + seconds);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + when);
      oscillator.stop(ctx.currentTime + when + seconds);
    } catch {
      // Sound is decoration: a failure here must never break the game.
    }
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    unlock() {
      ensure();
    },
    pickup() {
      blip(880, 0.12, 'sine', 0.12);
      blip(1318, 0.16, 'sine', 0.1, 0.07);
    },
    alarm() {
      blip(220, 0.22, 'square', 0.09);
      blip(174, 0.22, 'square', 0.09, 0.24);
      blip(220, 0.22, 'square', 0.09, 0.48);
    },
    caught() {
      blip(160, 0.4, 'sawtooth', 0.12);
      blip(90, 0.5, 'sawtooth', 0.12, 0.15);
    },
    escape() {
      blip(523, 0.14, 'sine', 0.12);
      blip(659, 0.14, 'sine', 0.12, 0.12);
      blip(784, 0.3, 'sine', 0.12, 0.24);
    },
    click() {
      blip(660, 0.06, 'sine', 0.08);
    },
  };
}
