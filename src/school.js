import { Chess } from 'chess.js';
import { Board, posFromChess } from './board.js';
import { LESSONS } from './lessons.js';
import { store } from './store.js';
import { sound } from './sound.js';
import { voice } from './voice.js';
import { h, modal, askPromotion, coachBubble, toast } from './ui.js';

const FILES = 'abcdefgh';

/* Lecture d'une FEN sans validation (positions d'apprentissage sans rois) */
function parseFen(fen) {
  const pos = {};
  fen.split(' ')[0].split('/').forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += +ch;
      else { pos[FILES[f] + (8 - i)] = (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toLowerCase(); f++; }
    }
  });
  return pos;
}

/* Déplacements « bruts » d'une pièce (sans tenir compte des échecs) */
function rawMoves(pos, sq, stars = new Set()) {
  const p = pos[sq];
  if (!p) return [];
  const [color, type] = p;
  const f0 = FILES.indexOf(sq[0]), r0 = +sq[1] - 1;
  const at = (f, r) => (f >= 0 && f < 8 && r >= 0 && r < 8 ? FILES[f] + (r + 1) : null);
  const out = [];
  const slide = (dirs, max = 8) => dirs.forEach(([df, dr]) => {
    for (let k = 1; k <= max; k++) {
      const s = at(f0 + df * k, r0 + dr * k);
      if (!s) break;
      const q = pos[s];
      if (q) { if (q[0] !== color) out.push(s); break; }
      out.push(s);
      if (stars.has(s)) break;
    }
  });
  const R = [[1, 0], [-1, 0], [0, 1], [0, -1]], B = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (type === 'r') slide(R);
  if (type === 'b') slide(B);
  if (type === 'q') slide([...R, ...B]);
  if (type === 'k') slide([...R, ...B], 1);
  if (type === 'n') [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(([df, dr]) => {
    const s = at(f0 + df, r0 + dr);
    if (s && (!pos[s] || pos[s][0] !== color)) out.push(s);
  });
  if (type === 'p') {
    const d = color === 'w' ? 1 : -1;
    const one = at(f0, r0 + d);
    if (one && !pos[one]) {
      out.push(one);
      const two = at(f0, r0 + 2 * d);
      if (r0 === (color === 'w' ? 1 : 6) && two && !pos[two]) out.push(two);
    }
    [-1, 1].forEach((df) => { const s = at(f0 + df, r0 + d); if (s && pos[s] && pos[s][0] !== color) out.push(s); });
  }
  return out;
}

/* ---------- Liste des leçons ---------- */
export function schoolScreen(app, nav) {
  const done = store.progress.done;
  const el = h(`<div class="screen">
    <div class="topbar"><button class="icon-btn" data-back>←</button><h2>L'École</h2></div>
    <div class="lessons">${LESSONS.map((l, i) => {
      const ok = done[l.id];
      const locked = i > 0 && !done[LESSONS[i - 1].id] && !ok;
      return `<button class="lesson-item ${ok ? 'done' : ''} ${locked ? 'locked' : ''}" data-i="${i}" ${locked ? 'data-locked' : ''}>
        <div class="num">${ok ? '★' : i + 1}</div>
        <div class="t"><b>${l.title}</b><small>${l.sub}</small></div>
        <span>${locked ? '🔒' : '›'}</span></button>`;
    }).join('')}</div></div>`);
  el.querySelector('[data-back]').onclick = () => nav('home');
  el.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => {
    if (b.hasAttribute('data-locked')) return toast('Termine d’abord la leçon précédente 🙂');
    nav('lesson', { index: +b.dataset.i });
  }));
  app.appendChild(el);
}

/* ---------- Une leçon ---------- */
export function lessonScreen(app, nav, { index }) {
  const lesson = LESSONS[index];
  let stepIdx = 0, solved = false, alive = true;
  let state = {};

  const el = h(`<div class="screen">
    <div class="topbar"><button class="icon-btn" data-back>←</button><h2>${lesson.title}</h2><button class="icon-btn" data-say title="Écouter">🔊</button></div>
    <div class="steps">${lesson.steps.map(() => '<i></i>').join('')}</div>
    <div data-coach></div>
    <div data-board></div>
    <div class="lesson-foot"><button class="btn ghost-btn" data-retry>↻ Recommencer</button><button class="btn gold" data-next>Suivant</button></div>
  </div>`);
  app.appendChild(el);
  const coach = coachBubble();
  el.querySelector('[data-coach]').appendChild(coach.el);
  const nextBtn = el.querySelector('[data-next]'), retryBtn = el.querySelector('[data-retry]');

  const board = new Board(el.querySelector('[data-board]'), {
    canSelect: (sq) => canSelect(sq),
    targets: (sq) => targets(sq),
    onMove: (f, t, anim) => onMove(f, t, anim),
    onTap: (sq) => onTap(sq),
  });

  const step = () => lesson.steps[stepIdx];

  function canSelect(sq) {
    const s = step();
    if (solved) return false;
    if (s.type === 'stars') return sq === state.at;
    if (s.type === 'puzzle') return state.chess.get(sq)?.color === state.chess.turn();
    return false;
  }

  function targets(sq) {
    const s = step();
    if (s.type === 'stars') return rawMoves(state.pos, sq, state.stars);
    if (s.type === 'puzzle') return [...new Set(state.chess.moves({ square: sq, verbose: true }).map((m) => m.to))];
    if (s.type === 'info') return [];
    return [];
  }

  function load() {
    const s = step();
    solved = s.type === 'info';
    board.locked = s.type === 'info';
    state = {};
    voice.stop();
    board.setMarks(s.marks || {});
    board.setStars([]);
    if (s.type === 'stars') {
      state.pos = { [s.from]: s.piece };
      state.at = s.from;
      state.stars = new Set(s.stars);
      state.moves = 0;
      board.setStars(s.stars);
      board.setPosition(state.pos);
    } else if (s.type === 'puzzle') {
      state.chess = new Chess(s.fen);
      board.setPosition(posFromChess(state.chess));
    } else {
      board.setPosition(parseFen(s.fen));
    }
    if (s.type === 'info' && s.showMoves) {
      const pos = parseFen(s.fen);
      const m = { ...(s.marks || {}) };
      m[s.showMoves] = ['sel'];
      board.marks = m;
      board.render();
      // affiche les déplacements possibles
      const ts = rawMoves(pos, s.showMoves);
      ts.forEach((t) => { const d = board.sqEls[t]; d.insertAdjacentHTML('beforeend', pos[t] ? '<span class="ring"></span>' : '<span class="dot"></span>'); });
    }
    coach.set(s.text);
    el.querySelectorAll('.steps i').forEach((d, i) => (d.className = i < stepIdx ? 'done' : i === stepIdx ? 'cur' : ''));
    retryBtn.style.display = s.type === 'stars' || s.type === 'puzzle' ? '' : 'none';
    updateNext();
  }

  function updateNext() {
    nextBtn.disabled = !solved;
    nextBtn.textContent = stepIdx === lesson.steps.length - 1 ? 'Terminer ✓' : 'Suivant';
  }

  function win(text) {
    solved = true;
    board.locked = true;
    sound.success();
    coach.set(`✨ <b>${text}</b>`);
    updateNext();
  }

  function onTap(sq) {
    const s = step();
    if (s.type !== 'tap' || solved) return;
    if (sq === s.target) { board.setMarks({ [sq]: ['good'] }); win('Exactement, c’est bien la case ' + sq + ' !'); }
    else { sound.error(); board.setMarks({ [sq]: ['danger'] }); coach.set(`Ça, c’est la case <b>${sq}</b>. Cherche la case <b>${s.target}</b> : d’abord la lettre en bas, puis le chiffre sur le côté.`); }
  }

  async function onMove(from, to, anim) {
    const s = step();
    if (s.type === 'stars') {
      const p = state.pos[from];
      state.pos = { [to]: p };
      state.at = to;
      state.moves++;
      board.setPosition(state.pos, anim ? { from, to } : null);
      board.setMarks({ [from]: ['last'], [to]: ['last'] });
      if (state.stars.delete(to)) { sound.star(); board.setStars([...state.stars]); }
      else sound.move();
      if (!state.stars.size) win(state.moves <= s.stars.length ? 'Parfait, en un minimum de coups !' : `Bravo, toutes les étoiles en ${state.moves} coups !`);
      return;
    }
    if (s.type === 'puzzle') {
      const c = state.chess;
      const cand = c.moves({ square: from, verbose: true }).filter((m) => m.to === to);
      let promotion;
      if (cand.some((m) => m.promotion)) promotion = await askPromotion(c.turn());
      const m = c.move({ from, to, promotion });
      board.setPosition(posFromChess(c), anim ? { from, to } : null);
      board.setMarks({ [from]: ['last'], [to]: ['last'] });
      if (s.accept(m, c)) {
        win(c.isCheckmate() ? 'Échec et mat, bravo !' : 'Bravo, c’est ça !');
      } else {
        sound.error();
        const txt = typeof s.wrong === 'function' ? s.wrong(m, c) : s.wrong || 'Pas tout à fait. Réessaie !';
        coach.set(`🤔 ${txt}`);
        board.locked = true;
        setTimeout(() => { if (alive && step() === s) { board.locked = false; c.undo(); board.setPosition(posFromChess(c)); board.setMarks({}); } }, 1300);
      }
    }
  }

  nextBtn.onclick = () => {
    if (!solved) return;
    board.locked = false;
    if (stepIdx < lesson.steps.length - 1) { stepIdx++; load(); return; }
    store.completeLesson(lesson.id, 3);
    voice.stop();
    const next = LESSONS[index + 1];
    const md = modal(`<div class="big">🏅</div><h3>Leçon terminée !</h3><p>Tu maîtrises maintenant : <b>${lesson.title.toLowerCase()}</b>.</p><div class="btns">${next ? `<button class="btn gold" data-n>Leçon suivante : ${next.title}</button>` : '<button class="btn gold" data-p>Jouer une partie</button>'}<button class="btn ghost-btn" data-l>Retour à l’École</button></div>`);
    sound.success();
    md.el.querySelector('[data-n]')?.addEventListener('click', () => { md.close(); nav('lesson', { index: index + 1 }); });
    md.el.querySelector('[data-p]')?.addEventListener('click', () => { md.close(); nav('setup'); });
    md.el.querySelector('[data-l]').onclick = () => { md.close(); nav('school'); };
  };
  retryBtn.onclick = () => { board.locked = false; load(); };
  el.querySelector('[data-say]').onclick = () => voice.speak(coach.text);
  el.querySelector('[data-back]').onclick = () => { voice.stop(); nav('school'); };

  load();
  return () => { alive = false; coach.dispose(); };
}
