import { store } from './store.js';
let ctx;
function tone(freq, dur, type = 'sine', vol = 0.15, delay = 0) {
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sound = {
  move() { if (store.settings.sound) { tone(220, 0.08, 'triangle', 0.18); tone(140, 0.06, 'sine', 0.1, 0.01); } buzz(8); },
  capture() { if (store.settings.sound) { tone(300, 0.07, 'square', 0.07); tone(160, 0.1, 'triangle', 0.18, 0.03); } buzz([10, 30, 10]); },
  check() { if (store.settings.sound) { tone(660, 0.12, 'sine', 0.12); tone(880, 0.16, 'sine', 0.1, 0.1); } buzz([15, 40, 15]); },
  star() { if (store.settings.sound) { tone(988, 0.1, 'sine', 0.12); tone(1319, 0.18, 'sine', 0.1, 0.08); } buzz(12); },
  success() { if (store.settings.sound) [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', 0.1, i * 0.1)); buzz([20, 50, 20]); },
  error() { if (store.settings.sound) { tone(200, 0.15, 'sine', 0.12); tone(150, 0.2, 'sine', 0.12, 0.12); } buzz(40); },
};
function buzz(p) { if (store.settings.vibrate && navigator.vibrate) navigator.vibrate(p); }
