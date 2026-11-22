import './style.css';
import { h } from './ui.js';
import { store } from './store.js';
import { voice, frenchVoices, pickVoice } from './voice.js';
import { LESSONS } from './lessons.js';
import { schoolScreen, lessonScreen } from './school.js';
import { setupScreen, gameScreen } from './game.js';

const app = document.getElementById('app');
let cleanup = null;

function nav(name, params = {}) {
  cleanup?.();
  cleanup = null;
  document.querySelectorAll('.modal-bg, .ghost').forEach((e) => e.remove());
  app.innerHTML = '';
  const screens = { home, school: schoolScreen, lesson: lessonScreen, setup: setupScreen, game: gameScreen, settings };
  cleanup = screens[name](app, nav, params) || null;
  window.scrollTo(0, 0);
}

/* ---------- Accueil ---------- */
function home(app, nav) {
  const done = Object.keys(store.progress.done).length;
  const pct = Math.round((done / LESSONS.length) * 100);
  const next = LESSONS.findIndex((l) => !store.progress.done[l.id]);
  const el = h(`<div class="screen">
    <div class="topbar"><span style="flex:1"></span><button class="icon-btn" data-settings title="Réglages">⚙︎</button></div>
    <div class="hero">
      <svg class="crown" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#1f3329"/><g fill="#c9a45c"><path d="M256 92c-14 0-25 11-25 25 0 9 5 17 12 21-26 9-45 33-45 62 0 20 9 38 23 50l-27 92h124l-27-92c14-12 23-30 23-50 0-29-19-53-45-62 7-4 12-12 12-21 0-14-11-25-25-25z"/><rect x="160" y="360" width="192" height="30" rx="10"/><rect x="140" y="398" width="232" height="32" rx="12"/></g></svg>
      <h1>Échecs</h1>
      <p>Apprendre pas à pas, à ton rythme.</p>
    </div>
    <div class="progress-card">
      <div class="row"><span>Ta progression</span><b>${done} / ${LESSONS.length}</b></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </div>
    <div class="menu">
      <button class="menu-item" data-school><div class="ico">🎓</div><div><b>L'École</b><small>${next === -1 ? 'Toutes les leçons sont terminées ✓' : done ? `Continuer : ${LESSONS[next].title}` : 'Commence ici : les règles, pièce par pièce'}</small></div></button>
      <button class="menu-item light" data-play><div class="ico">♞</div><div><b>Jouer</b><small>${store.savedGame ? 'Une partie est en cours' : 'Contre l’ordinateur, avec un coach'}</small></div></button>
    </div>
    <p class="note" style="margin-top:auto">Appuie sur 🔊 à tout moment pour qu'on t'explique.</p>
  </div>`);
  el.querySelector('[data-school]').onclick = () => (done === 0 ? nav('lesson', { index: 0 }) : nav('school'));
  el.querySelector('[data-play]').onclick = () => nav('setup');
  el.querySelector('[data-settings]').onclick = () => nav('settings');
  app.appendChild(el);
}

/* ---------- Réglages ---------- */
function settings(app, nav) {
  const s = store.settings;
  const el = h(`<div class="screen">
    <div class="topbar"><button class="icon-btn" data-back>←</button><h2>Réglages</h2></div>
    <div class="label">Voix</div>
    <div class="setting"><label>Voix</label><select data-voice></select></div>
    <div class="setting"><label>Vitesse</label><input type="range" min="0.7" max="1.3" step="0.05" value="${s.rate}" data-rate /></div>
    <button class="btn ghost-btn" data-test>🔊 Tester la voix</button>
    <div class="label">Jeu</div>
    <div class="setting"><label>Aides du coach<br><small style="color:var(--muted)">Alertes de danger et d'erreur</small></label><button class="switch" data-k="helpers"></button></div>
    <div class="setting"><label>Sons</label><button class="switch" data-k="sound"></button></div>
    <div class="setting"><label>Vibrations</label><button class="switch" data-k="vibrate"></button></div>
    <p class="note">Astuce iPhone : pour une voix plus naturelle, télécharge une voix française « améliorée » dans Réglages › Accessibilité › Contenu énoncé › Voix › Français.</p>
  </div>`);
  const sel = el.querySelector('[data-voice]');
  const fill = () => {
    const vs = frenchVoices();
    const cur = pickVoice();
    sel.innerHTML = vs.length ? vs.map((v) => `<option value="${v.voiceURI}" ${cur && v.voiceURI === cur.voiceURI ? 'selected' : ''}>${v.name}</option>`).join('') : '<option>Voix par défaut</option>';
  };
  fill();
  if (window.speechSynthesis) speechSynthesis.addEventListener?.('voiceschanged', fill);
  sel.onchange = () => { store.setSetting('voiceURI', sel.value); voice.speak('Bonjour ! C’est moi qui t’accompagnerai.'); };
  el.querySelector('[data-rate]').oninput = (e) => store.setSetting('rate', +e.target.value);
  el.querySelector('[data-test]').onclick = () => voice.speak('Bonjour ! Je suis là pour t’apprendre les échecs. Le cavalier se déplace en L.');
  el.querySelectorAll('.switch').forEach((b) => {
    b.classList.toggle('on', !!s[b.dataset.k]);
    b.onclick = () => { store.setSetting(b.dataset.k, !s[b.dataset.k]); b.classList.toggle('on', !!s[b.dataset.k]); };
  });
  el.querySelector('[data-back]').onclick = () => nav('home');
  app.appendChild(el);
}

nav('home');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
