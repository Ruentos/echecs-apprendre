import { voice } from './voice.js';
import { PIECES } from './pieces.js';

export function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

export function toast(text) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = h(`<div class="toast">${text}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2700);
}

export function modal(inner) {
  const bg = h(`<div class="modal-bg"><div class="modal"></div></div>`);
  const m = bg.firstElementChild;
  if (typeof inner === 'string') m.innerHTML = inner; else m.appendChild(inner);
  document.body.appendChild(bg);
  return { el: m, close: () => bg.remove() };
}

export function askPromotion(color) {
  return new Promise((resolve) => {
    const md = modal(`<h3>Promotion !</h3><p>Ton pion est arrivé au bout. Choisis ce qu'il devient :</p><div class="promo">${['q', 'r', 'b', 'n'].map((t) => `<button data-t="${t}" style="background-image:url('${PIECES[color + t]}')"></button>`).join('')}</div>`);
    md.el.querySelectorAll('button').forEach((b) => (b.onclick = () => { md.close(); resolve(b.dataset.t); }));
  });
}

/** Bulle du coach avec animation pendant que la voix parle */
export function coachBubble() {
  const el = h(`<div class="coach"><div class="face">♛</div><div><div class="msg"></div><div class="actions"></div></div></div>`);
  const msg = el.querySelector('.msg'), actions = el.querySelector('.actions');
  const off = voice.onState((on) => el.classList.toggle('speaking', on));
  return {
    el,
    set(text, { warn = false, buttons = [] } = {}) {
      msg.innerHTML = text;
      el.classList.toggle('warn', warn);
      actions.innerHTML = '';
      buttons.forEach(([label, cls, fn]) => { const b = h(`<button class="btn ${cls}">${label}</button>`); b.onclick = fn; actions.appendChild(b); });
      actions.style.display = buttons.length ? 'flex' : 'none';
    },
    get text() { return msg.textContent; },
    dispose: off,
  };
}
