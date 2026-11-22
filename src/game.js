import { Chess } from 'chess.js';
import { Board, posFromChess } from './board.js';
import { think, warmup } from './engine.js';
import { store } from './store.js';
import { sound } from './sound.js';
import { voice } from './voice.js';
import { h, toast, modal, askPromotion, coachBubble } from './ui.js';
import { PIECES } from './pieces.js';
import { NAMES, VALUE, hangingPieces, uciToMove, describeMove, intention, verdict, RULES, TIPS, ton, le } from './coach.js';

export const LEVELS = [
  { name: 'Léon', label: 'Débutant', desc: 'Joue tranquillement et fait des erreurs.', skill: 0, depth: 3, movetime: 150, random: 0.4 },
  { name: 'Clara', label: 'Intermédiaire', desc: 'Un vrai défi quand tu connais les bases.', skill: 5, depth: 8, movetime: 400, random: 0.05 },
  { name: 'Victor', label: 'Confirmé', desc: 'Solide et précis. Pour plus tard !', skill: 14, depth: 14, movetime: 900, random: 0 },
];

/* ---------- Écran de choix ---------- */
export function setupScreen(app, nav) {
  const s = store.settings;
  let level = s.level, color = s.color;
  const el = h(`<div class="screen">
    <div class="topbar"><button class="icon-btn" data-back>←</button><h2>Nouvelle partie</h2></div>
    <div class="label">Ton adversaire</div>
    <div class="choices">${LEVELS.map((L, i) => `<button class="choice" data-l="${i}"><div class="avatar">${L.name[0]}</div><div><b>${L.name} · ${L.label}</b><small>${L.desc}</small></div></button>`).join('')}</div>
    <div class="label">Tu joues</div>
    <div class="seg"><button data-c="w">Les blancs</button><button data-c="b">Les noirs</button><button data-c="r">Au hasard</button></div>
    <p class="note">Les blancs jouent toujours le premier coup.</p>
    <div style="margin-top:auto;display:flex;flex-direction:column;gap:10px">
      ${store.savedGame ? '<button class="btn ghost-btn wide" data-resume>Reprendre la partie en cours</button>' : ''}
      <button class="btn gold wide" data-go>Commencer</button>
    </div></div>`);
  const refresh = () => {
    el.querySelectorAll('[data-l]').forEach((b) => b.classList.toggle('on', +b.dataset.l === level));
    el.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('on', b.dataset.c === color));
  };
  el.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => { level = +b.dataset.l; refresh(); }));
  el.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { color = b.dataset.c; refresh(); }));
  el.querySelector('[data-back]').onclick = () => nav('home');
  el.querySelector('[data-go]').onclick = () => {
    store.setSetting('level', level); store.setSetting('color', color);
    const c = color === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : color;
    store.savedGame = null;
    nav('game', { level, color: c });
  };
  const r = el.querySelector('[data-resume]');
  if (r) r.onclick = () => nav('game', store.savedGame);
  refresh();
  warmup();
  app.appendChild(el);
}

/* ---------- Partie ---------- */
export function gameScreen(app, nav, { level = 0, color = 'w', pgn = null } = {}) {
  const L = LEVELS[level];
  const me = color, them = color === 'w' ? 'b' : 'w';
  const chess = new Chess();
  if (pgn) try { chess.loadPgn(pgn); } catch {}

  let gen = 0;            // invalide les calculs devenus obsolètes (annulation)
  let busy = false;       // l'ordinateur réfléchit
  let pending = null;     // avertissement en attente de décision
  let pre = null;         // analyse de la position avant le coup du joueur
  let lastUser = null, lastEngine = null;
  let dangers = [], hint = { tier: 0, from: null, to: null }, lastMove = null;
  let over = false;

  const el = h(`<div class="screen">
    <div class="topbar"><button class="icon-btn" data-back>←</button><h2>Contre ${L.name}</h2><button class="icon-btn" data-new title="Nouvelle partie">↻</button></div>
    <div class="player" data-them><div class="avatar">${L.name[0]}</div><span class="name">${L.name} <small style="color:var(--muted);font-weight:400">· ${L.label}</small></span><span class="thinking" hidden>réfléchit</span><span class="captured"></span></div>
    <div data-board></div>
    <div class="player" data-me><div class="avatar" style="background:var(--gold);color:#fff">★</div><span class="name">Toi</span><span class="captured"></span></div>
    <div class="evalbar" title="Qui a l'avantage"><i style="width:50%"></i></div>
    <div data-coach></div>
    <div class="actionbar">
      <button class="action primary" data-explain><span>🔊</span>Explique</button>
      <button class="action" data-hint><span>💡</span>Indice</button>
      <button class="action" data-undo><span>↩️</span>Annuler</button>
    </div></div>`);
  app.appendChild(el);

  const coach = coachBubble();
  el.querySelector('[data-coach]').appendChild(coach.el);
  const thinking = el.querySelector('.thinking');

  const board = new Board(el.querySelector('[data-board]'), {
    orientation: me,
    canSelect: (sq) => !busy && !pending && !over && chess.turn() === me && chess.get(sq)?.color === me,
    targets: (sq) => [...new Set(chess.moves({ square: sq, verbose: true }).map((m) => m.to))],
    onMove: async (from, to, animate) => {
      const cands = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to);
      if (!cands.length) return;
      let promotion;
      if (cands.some((m) => m.promotion)) promotion = await askPromotion(me);
      userMove({ from, to, promotion }, animate);
    },
  });

  /* --- affichage --- */
  function draw(anim) {
    const marks = {};
    const add = (sq, c) => sq && (marks[sq] ||= []).push(c);
    if (lastMove) { add(lastMove.from, 'last'); add(lastMove.to, 'last'); }
    if (chess.inCheck()) {
      const k = chess.board().flat().find((p) => p && p.type === 'k' && p.color === chess.turn());
      add(k.square, 'check');
    }
    dangers.forEach((d) => add(d.square, 'danger'));
    if (hint.tier >= 1) add(hint.from, 'hint');
    if (hint.tier >= 2) add(hint.to, 'target');
    board.marks = marks;
    board.setPosition(posFromChess(chess), anim);
    drawCaptured();
  }

  function drawCaptured() {
    const taken = { w: [], b: [] };
    chess.history({ verbose: true }).forEach((m) => m.captured && taken[m.color].push(m.captured));
    const score = (arr) => arr.reduce((s, t) => s + VALUE[t], 0);
    const diff = score(taken[me]) - score(taken[them]);
    const render = (who, list, d) => {
      const box = el.querySelector(`[data-${who}] .captured`);
      const other = who === 'me' ? them : me;
      box.innerHTML = list.sort((a, b) => VALUE[a] - VALUE[b]).map((t) => `<i style="background-image:url('${PIECES[other + t]}')"></i>`).join('') + (d > 0 ? `<small style="margin-left:6px;color:var(--muted)">+${d}</small>` : '');
    };
    render('me', taken[me], diff);
    render('them', taken[them], -diff);
  }

  function setEval(cpForMe) {
    const pct = 50 + 50 * Math.tanh((cpForMe || 0) / 500);
    const bar = el.querySelector('.evalbar i');
    bar.style.width = pct + '%';
  }

  function setBusy(b) { busy = b; thinking.hidden = !b; }

  function save() { store.savedGame = over ? null : { level, color: me, pgn: chess.pgn() }; }

  function startPre() {
    const fen = chess.fen();
    pre = { fen, promise: think(fen, { depth: 10, movetime: 700 }) };
    pre.promise.then((r) => { if (pre?.fen === fen) setEval(r.cp); });
  }

  function playSound(m) {
    if (chess.inCheck()) sound.check(); else if (m.captured) sound.capture(); else sound.move();
  }

  function specialToast(m) {
    if (m.flags.includes('k') || m.flags.includes('q')) toast('♜ Roque ! Appuie sur 🔊 pour comprendre');
    else if (m.flags.includes('e')) toast('Prise en passant ! Appuie sur 🔊');
    else if (m.promotion) toast('Promotion du pion ! Appuie sur 🔊');
  }

  /* --- coup du joueur --- */
  async function userMove(mv, animate) {
    const myGen = gen;
    const beforeFen = chess.fen();
    const before = pre && pre.fen === beforeFen ? pre.promise : think(beforeFen, { depth: 10, movetime: 700 });
    const m = chess.move(mv);
    lastMove = m; hint = { tier: 0 }; dangers = [];
    draw(animate ? { from: m.from, to: m.to } : null);
    playSound(m);
    specialToast(m);
    save();
    if (chess.isGameOver()) return end();

    setBusy(true);
    coach.set('<span class="thinking">Je regarde ton coup</span>');
    const [b, a] = await Promise.all([before, think(chess.fen(), { depth: 10, movetime: 700 })]);
    if (myGen !== gen) return;
    const reply = uciToMove(chess.fen(), a.best);
    const v = verdict({ beforeCp: b.cp, afterCp: -a.cp, bestUci: b.best, beforeFen, move: m, reply });
    lastUser = { move: m, verdict: v };
    setEval(-a.cp);

    if (store.settings.helpers && v.level === 'bad') {
      setBusy(false);
      if (reply?.captured) dangers = [{ square: reply.to }];
      draw();
      pending = true;
      sound.error();
      coach.set(`⚠️ <b>${v.short}</b><br>${v.text}`, {
        warn: true,
        buttons: [
          ['↩️ Annuler ce coup', 'gold', () => undo()],
          ['Jouer quand même', 'ghost-btn', () => { pending = null; dangers = []; draw(); engineTurn(myGen); }],
        ],
      });
      return;
    }
    coach.set(v.level === 'good' ? `👍 <b>${v.short}</b> ${v.text.replace(/^(Excellent, c’est le meilleur coup !|Bon coup\.)\s*/, '')}` : `<b>${v.short}.</b> ${v.text.replace(/^Coup correct, /, '')}`);
    engineTurn(myGen);
  }

  /* --- coup de l'ordinateur --- */
  async function engineTurn(myGen = gen) {
    setBusy(true);
    const fen = chess.fen();
    const t0 = Date.now();
    let uci;
    if (Math.random() < L.random) {
      const ms = chess.moves({ verbose: true });
      const r = ms[Math.floor(Math.random() * ms.length)];
      uci = r.from + r.to + (r.promotion || '');
    } else {
      uci = (await think(fen, { skill: L.skill, depth: L.depth, movetime: L.movetime })).best;
    }
    await new Promise((r) => setTimeout(r, Math.max(0, 650 - (Date.now() - t0))));
    if (myGen !== gen) return;
    const m = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' });
    lastEngine = { move: m, before: fen, num: chess.history().length };
    lastMove = m;
    dangers = store.settings.helpers ? hangingPieces(chess, me) : [];
    setBusy(false);
    draw({ from: m.from, to: m.to });
    playSound(m);
    specialToast(m);
    save();
    if (chess.isGameOver()) return end();

    let msg = `${L.name} joue <b>${NAMES[m.piece]} ${m.from} → ${m.to}</b>${m.captured ? ` et prend ${ton(m.captured)}` : ''}.`;
    if (chess.inCheck()) msg += `<br>⚠️ <b>Échec !</b> Protège ton roi.`;
    else if (dangers.length) msg += `<br>⚠️ ${cap(ton(dangers[0].type))} en ${dangers[0].square} est menacé${dangers[0].type === 'r' || dangers[0].type === 'q' ? 'e' : ''}.`;
    else msg += ' À toi !';
    coach.set(msg);
    startPre();
  }

  /* --- fin de partie --- */
  function end() {
    over = true;
    setBusy(false);
    save();
    let icon, title, text;
    if (chess.isCheckmate()) {
      const won = chess.turn() === them;
      icon = won ? '🏆' : '♚';
      title = won ? 'Échec et mat !' : 'Mat…';
      text = won ? `Bravo, tu as battu ${L.name} ! Le roi adverse ne pouvait plus s'échapper.` : `${L.name} a gagné cette fois. Chaque partie perdue t'apprend quelque chose : rejoue et utilise l'indice 💡 en cas de doute.`;
      won ? sound.success() : sound.error();
    } else {
      icon = '🤝';
      title = 'Partie nulle';
      text = chess.isStalemate() ? 'Pat : le joueur qui devait jouer n’avait aucun coup légal, mais son roi n’était pas en échec. Personne ne gagne.' : chess.isThreefoldRepetition() ? 'La même position est revenue trois fois : c’est nul.' : chess.isInsufficientMaterial() ? 'Il ne reste plus assez de pièces pour faire mat : c’est nul.' : 'La partie est nulle.';
    }
    coach.set(`<b>${title}</b> ${text}`);
    setTimeout(() => {
      const md = modal(`<div class="big">${icon}</div><h3>${title}</h3><p>${text}</p><div class="btns"><button class="btn gold" data-a>Rejouer</button><button class="btn ghost-btn" data-r>Revoir l'échiquier</button><button class="btn ghost-btn" data-h>Accueil</button></div>`);
      voice.speak(`${title} ${text}`);
      md.el.querySelector('[data-a]').onclick = () => { md.close(); nav('game', { level, color: me }); };
      md.el.querySelector('[data-r]').onclick = () => md.close();
      md.el.querySelector('[data-h]').onclick = () => { md.close(); nav('home'); };
    }, 700);
  }

  /* --- annuler --- */
  function undo() {
    const hist = chess.history({ verbose: true });
    if (!hist.some((m) => m.color === me)) return toast('Rien à annuler pour l’instant');
    gen++;
    pending = null; over = false;
    chess.undo();
    while (chess.turn() !== me && chess.history().length) chess.undo();
    setBusy(false);
    const h2 = chess.history({ verbose: true });
    lastMove = h2[h2.length - 1] || null;
    lastUser = null; lastEngine = null; dangers = []; hint = { tier: 0 };
    draw();
    save();
    coach.set('↩️ Coup annulé. À toi de rejouer !');
    startPre();
  }

  /* --- indice en 3 étapes --- */
  async function giveHint() {
    if (over || busy || pending || chess.turn() !== me) return;
    if (!pre) startPre();
    const fen = chess.fen();
    const r = await pre.promise;
    if (chess.fen() !== fen) return;
    const best = uciToMove(fen, r.best);
    if (!best) return;
    hint = { tier: Math.min(3, (hint.tier || 0) + 1), from: best.from, to: best.to };
    const p = ton(best.piece);
    let msg;
    if (hint.tier === 1) msg = `💡 <b>Indice 1/3</b> — Regarde bien ${p} en ${best.from}.`;
    else if (hint.tier === 2) msg = `💡 <b>Indice 2/3</b> — ${cap(p)} peut aller sur une case intéressante, surlignée en vert.`;
    else msg = `💡 <b>Solution</b> — Joue ${p} de ${best.from} en ${best.to}. ${intention(fen, best, chess.history().length)}`;
    draw();
    coach.set(msg);
  }

  /* --- explication vocale --- */
  function explain() {
    let text;
    const sel = board.selected && chess.get(board.selected);
    if (sel && sel.color === me) {
      text = `${cap(le(sel.type))} : ${RULES[sel.type]}`;
    } else if (over || pending) {
      text = coach.text;
    } else if (busy && lastUser) {
      text = lastUser.verdict.text;
    } else if (lastEngine && chess.turn() === me) {
      const m = lastEngine.move;
      text = describeMove(m, 'ordi') + ' ' + intention(lastEngine.before, m, lastEngine.num);
      if (chess.inCheck()) text += ' Pour sortir d’un échec, tu as trois solutions : déplacer ton roi, mettre une pièce entre ton roi et l’attaquant, ou prendre la pièce qui attaque.';
      else if (dangers.length) text += ` Attention, ${ton(dangers[0].type)} en ${dangers[0].square} est en danger : protège-${dangers[0].type === 'r' || dangers[0].type === 'q' ? 'la' : 'le'} ou déplace-${dangers[0].type === 'r' || dangers[0].type === 'q' ? 'la' : 'le'}.`;
      if (lastUser) text += ` Pour ton coup précédent : ${lastUser.verdict.text}`;
    } else if (!chess.history().length) {
      text = me === 'w' ? `C'est le début de la partie. Tu as les blancs, tu commences. ${TIPS[0]} Astuce : touche une de tes pièces puis appuie sur Explique pour savoir comment elle se déplace.` : `Tu as les noirs : ${L.name} commence.`;
    } else {
      text = TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    coach.set(text);
    voice.speak(text);
  }

  el.querySelector('[data-explain]').onclick = explain;
  el.querySelector('[data-hint]').onclick = giveHint;
  el.querySelector('[data-undo]').onclick = undo;
  el.querySelector('[data-back]').onclick = () => { gen++; voice.stop(); nav('home'); };
  el.querySelector('[data-new]').onclick = () => { gen++; voice.stop(); store.savedGame = null; nav('setup'); };

  /* --- démarrage --- */
  const hist = chess.history({ verbose: true });
  lastMove = hist[hist.length - 1] || null;
  draw();
  if (chess.isGameOver()) end();
  else if (chess.turn() === them) { coach.set(`${L.name} commence…`); engineTurn(); }
  else {
    coach.set(hist.length ? 'Partie reprise. À toi de jouer !' : `Tu as les ${me === 'w' ? 'blancs' : 'noirs'}. Touche une pièce pour voir où elle peut aller. Appuie sur <b>🔊 Explique</b> quand tu veux.`);
    startPre();
  }

  return () => { gen++; coach.dispose(); };
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);
