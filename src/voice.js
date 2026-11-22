import { store } from './store.js';

// Voix féminines françaises connues (iPhone, Android, Windows, Mac)
const PREFERRED = ['amélie', 'amelie', 'audrey', 'aurélie', 'aurelie', 'marie', 'denise', 'julie', 'hortense', 'eloise', 'éloïse', 'vivienne', 'céline', 'celine', 'léa', 'virginie', 'google français', 'fr-fr-x-frc', 'fr-fr-x-vlf', 'female', 'femme'];
const MALE = ['thomas', 'daniel', 'henri', 'paul', 'nicolas', 'jacques', 'rémy', 'remy', 'claude', 'antoine', 'male', 'homme', 'fr-fr-x-frd', 'fr-fr-x-fre'];

const synth = window.speechSynthesis;
let listeners = [];

export function frenchVoices() {
  if (!synth) return [];
  return synth.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('fr'));
}

function score(v) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (v.lang.toLowerCase() === 'fr-fr') s += 5;
  const i = PREFERRED.findIndex((p) => n.includes(p));
  if (i >= 0) s += 50 - i;
  if (MALE.some((m) => n.includes(m))) s -= 60;
  if (/premium|enhanced|améliorée|natural|neural|online/.test(n)) s += 20;
  return s;
}

export function pickVoice() {
  const list = frenchVoices();
  const chosen = list.find((v) => v.voiceURI === store.settings.voiceURI);
  if (chosen) return chosen;
  return list.sort((a, b) => score(b) - score(a))[0] || null;
}

/** Transforme "e4" en texte prononçable */
function speakable(text) {
  const L = { a: 'a', b: 'bé', c: 'cé', d: 'dé', e: 'e', f: 'èf', g: 'gé', h: 'ache' };
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\b([a-h])([1-8])\b/g, (_, f, r) => `${L[f]} ${r}`)
    .replace(/[★⚠️👍💡🔊♟️✨]/gu, '');
}

export const voice = {
  supported: !!synth,
  speak(text) {
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang || 'fr-FR';
    u.rate = store.settings.rate;
    u.pitch = 1.05;
    u.onstart = () => listeners.forEach((f) => f(true));
    u.onend = u.onerror = () => listeners.forEach((f) => f(false));
    synth.speak(u);
  },
  stop() { synth?.cancel(); listeners.forEach((f) => f(false)); },
  onState(f) { listeners.push(f); return () => (listeners = listeners.filter((x) => x !== f)); },
};
if (synth) synth.onvoiceschanged = () => {};
