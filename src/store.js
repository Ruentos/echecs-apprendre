const KEY = 'echecs-app-v1';
const defaults = {
  settings: { voiceURI: '', rate: 1, sound: true, vibrate: true, helpers: true, level: 1, color: 'w' },
  progress: { done: {} },
  savedGame: null,
};
let data;
try { data = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { data = { ...defaults }; }
data.settings = { ...defaults.settings, ...data.settings };
data.progress = { ...defaults.progress, ...data.progress };

export const store = {
  get settings() { return data.settings; },
  get progress() { return data.progress; },
  get savedGame() { return data.savedGame; },
  set savedGame(v) { data.savedGame = v; save(); },
  setSetting(k, v) { data.settings[k] = v; save(); },
  completeLesson(id, stars) { data.progress.done[id] = Math.max(stars, data.progress.done[id] || 0); save(); },
};
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} }
