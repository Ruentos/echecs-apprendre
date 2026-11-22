import { PIECES } from './pieces.js';

const FILES = 'abcdefgh';

/**
 * Échiquier tactile : toucher-toucher ou glisser-déposer.
 * opts.canSelect(sq) -> bool, opts.targets(sq) -> [sq], opts.onMove(from, to), opts.onTap(sq)
 */
export class Board {
  constructor(container, opts = {}) {
    this.opts = opts;
    this.orientation = opts.orientation || 'w';
    this.pos = {};
    this.marks = {};
    this.stars = new Set();
    this.selected = null;
    this.locked = false;
    this.wrap = document.createElement('div');
    this.wrap.className = 'board-wrap';
    this.el = document.createElement('div');
    this.el.className = 'board';
    this.wrap.appendChild(this.el);
    container.appendChild(this.wrap);
    this.sqEls = {};
    this.build();
    this.el.addEventListener('pointerdown', (e) => this.down(e));
    this.el.addEventListener('pointermove', (e) => this.move(e));
    this.el.addEventListener('pointerup', (e) => this.up(e));
    this.el.addEventListener('pointercancel', () => this.cancelDrag());
  }

  build() {
    this.el.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const file = this.orientation === 'w' ? c : 7 - c;
        const rank = this.orientation === 'w' ? 7 - r : r;
        const sq = FILES[file] + (rank + 1);
        const d = document.createElement('div');
        d.className = 'sq ' + ((file + rank) % 2 ? 'light' : 'dark');
        d.dataset.sq = sq;
        this.sqEls[sq] = d;
        this.el.appendChild(d);
      }
    }
    this.render();
  }

  setOrientation(o) { if (o !== this.orientation) { this.orientation = o; this.build(); } }

  /** pos : { e4: 'wp', ... } ; anim : { from, to } pour animer un coup */
  setPosition(pos, anim) {
    this.pos = { ...pos };
    this.selected = null;
    this.render();
    if (anim) this.animate(anim.from, anim.to);
  }

  setMarks(marks) { this.marks = marks || {}; this.render(); }
  setStars(list) { this.stars = new Set(list); this.render(); }

  render() {
    const targets = this.selected ? this.opts.targets?.(this.selected) || [] : [];
    for (const [sq, d] of Object.entries(this.sqEls)) {
      const light = d.classList.contains('light') ? 'light' : 'dark';
      const cls = ['sq', light, ...(this.marks[sq] || [])];
      if (sq === this.selected) cls.push('sel');
      d.className = cls.join(' ');
      let html = '';
      const f = sq[0], r = sq[1];
      const bottomRank = this.orientation === 'w' ? '1' : '8';
      const leftFile = this.orientation === 'w' ? 'a' : 'h';
      if (r === bottomRank) html += `<span class="coord file">${f}</span>`;
      if (f === leftFile) html += `<span class="coord rank">${r}</span>`;
      if (this.stars.has(sq)) html += '<span class="star">★</span>';
      const p = this.pos[sq];
      if (p) html += `<div class="piece" style="background-image:url('${PIECES[p]}')"></div>`;
      if (targets.includes(sq)) html += p || this.stars.has(sq) ? '<span class="ring"></span>' : '<span class="dot"></span>';
      d.innerHTML = html;
    }
  }

  animate(from, to) {
    const a = this.sqEls[from], b = this.sqEls[to];
    const piece = b?.querySelector('.piece');
    if (!a || !piece) return;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    piece.style.transform = `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px)`;
    piece.style.zIndex = 5;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      piece.classList.add('moving');
      piece.style.transform = '';
    }));
  }

  sqAt(x, y) {
    const r = this.el.getBoundingClientRect();
    const c = Math.floor(((x - r.left) / r.width) * 8);
    const rr = Math.floor(((y - r.top) / r.height) * 8);
    if (c < 0 || c > 7 || rr < 0 || rr > 7) return null;
    const file = this.orientation === 'w' ? c : 7 - c;
    const rank = this.orientation === 'w' ? 7 - rr : rr;
    return FILES[file] + (rank + 1);
  }

  select(sq) { this.selected = sq; this.render(); }
  deselect() { this.selected = null; this.render(); }

  down(e) {
    if (this.locked) return;
    const sq = this.sqAt(e.clientX, e.clientY);
    if (!sq) return;
    e.preventDefault();
    if (this.selected && sq !== this.selected && (this.opts.targets?.(this.selected) || []).includes(sq)) {
      const from = this.selected;
      this.selected = null;
      this.opts.onMove?.(from, sq, true);
      return;
    }
    if (this.opts.canSelect?.(sq)) {
      const wasSelected = this.selected === sq;
      this.select(sq);
      this.drag = { sq, x: e.clientX, y: e.clientY, started: false, wasSelected };
      this.el.setPointerCapture(e.pointerId);
    } else {
      this.deselect();
      this.opts.onTap?.(sq);
    }
  }

  move(e) {
    const d = this.drag;
    if (!d) return;
    if (!d.started) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.started = true;
      const size = this.el.getBoundingClientRect().width / 8;
      d.size = size * 1.15;
      d.ghost = document.createElement('div');
      d.ghost.className = 'ghost';
      d.ghost.style.width = d.ghost.style.height = d.size + 'px';
      d.ghost.style.backgroundImage = `url('${PIECES[this.pos[d.sq]]}')`;
      document.body.appendChild(d.ghost);
      this.sqEls[d.sq].querySelector('.piece')?.classList.add('lifted');
    }
    // la pièce flotte un peu au-dessus du doigt pour rester visible
    d.ghost.style.left = e.clientX - d.size / 2 + 'px';
    d.ghost.style.top = e.clientY - d.size * 0.85 + 'px';
    const over = this.sqAt(e.clientX, e.clientY - d.size * 0.35);
    if (over !== d.over) {
      if (d.over) this.sqEls[d.over]?.classList.remove('hover');
      d.over = over;
      if (over) this.sqEls[over]?.classList.add('hover');
    }
  }

  up(e) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    if (d.ghost) {
      d.ghost.remove();
      const to = d.over;
      if (to && to !== d.sq && (this.opts.targets?.(d.sq) || []).includes(to)) {
        this.selected = null;
        this.opts.onMove?.(d.sq, to, false);
        return;
      }
      this.render();
    } else if (d.wasSelected) {
      this.deselect();
    }
  }

  cancelDrag() { if (this.drag?.ghost) this.drag.ghost.remove(); this.drag = null; this.render(); }
}

/** Convertit un objet chess.js en carte { e4: 'wp' } */
export function posFromChess(chess) {
  const pos = {};
  chess.board().forEach((row) => row.forEach((p) => { if (p) pos[p.square] = p.color + p.type; }));
  return pos;
}
