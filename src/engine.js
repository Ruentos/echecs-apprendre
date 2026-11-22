// Stockfish dans un Web Worker, avec une file d'attente de calculs.
let worker, queue = Promise.resolve(), handlers = [];

function init() {
  if (worker) return;
  worker = new Worker(new URL('engine/stockfish.js', document.baseURI));
  worker.onmessage = (e) => { const line = typeof e.data === 'string' ? e.data : ''; handlers.slice().forEach((h) => h(line)); };
  worker.postMessage('uci');
  worker.postMessage('isready');
}

/** Score converti en centipions du point de vue du camp qui doit jouer */
export function toCp(score) {
  if (!score) return 0;
  if (score.type === 'mate') return score.v > 0 ? 10000 - score.v * 10 : -10000 - score.v * 10;
  return score.v;
}

export function think(fen, { skill = 20, depth = 10, movetime = 800 } = {}) {
  init();
  const job = () => new Promise((resolve) => {
    let score = null;
    const h = (line) => {
      if (line.startsWith('info') && line.includes(' score ')) {
        const m = line.match(/score (cp|mate) (-?\d+)/);
        if (m) score = { type: m[1], v: +m[2] };
      } else if (line.startsWith('bestmove')) {
        handlers = handlers.filter((x) => x !== h);
        const best = line.split(' ')[1];
        resolve({ best: best && best !== '(none)' ? best : null, score, cp: toCp(score) });
      }
    };
    handlers.push(h);
    worker.postMessage('setoption name Skill Level value ' + skill);
    worker.postMessage('position fen ' + fen);
    worker.postMessage(`go depth ${depth} movetime ${movetime}`);
  });
  const p = queue.then(job);
  queue = p.catch(() => {});
  return p;
}

export function warmup() { init(); }
