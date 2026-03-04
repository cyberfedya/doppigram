// iPhone-style notification sounds using Web Audio API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

/** iPhone tri-tone notification sound */
export function playMessageSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    // Classic iPhone tri-tone: three ascending notes
    const notes = [
      { freq: 1046.50, time: 0, dur: 0.08 },      // C6
      { freq: 1318.51, time: 0.1, dur: 0.08 },     // E6
      { freq: 1567.98, time: 0.2, dur: 0.12 },     // G6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.12, now + time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch {
    // Audio not available
  }
}

/** Soft send sound — single low click */
export function playSendSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // Audio not available
  }
}
