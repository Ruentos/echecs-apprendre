import { Chess } from 'chess.js';

export const NAMES = { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' };
export const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const FEM = { r: true, q: true };
export const le = (t) => (FEM[t] ? 'la ' : 'le ') + NAMES[t];
export const ton = (t) => (FEM[t] ? 'ta ' : 'ton ') + NAMES[t];
export const son = (t) => (FEM[t] ? 'sa ' : 'son ') + NAMES[t];
export const un = (t) => (FEM[t] ? 'une ' : 'un ') + NAMES[t];

/** Pièces de `color` attaquées et mal défendues */
export function hangingPieces(chess, color) {
  const opp = color === 'w' ? 'b' : 'w';
  const out = [];
  for (const row of chess.board()) for (const p of row) {
    if (!p || p.color !== color || p.type === 'k') continue;
    const att = chess.attackers(p.square, opp);
    if (!att.length) continue;
    const def = chess.attackers(p.square, color);
    const minAtt = Math.min(...att.map((s) => VALUE[chess.get(s).type]));
    if (!def.length || minAtt < VALUE[p.type]) out.push({ square: p.square, type: p.type, by: att });
  }
  return out.sort((a, b) => VALUE[b.type] - VALUE[a.type]);
}

export function uciToMove(fen, uci) {
  if (!uci) return null;
  const c = new Chess(fen);
  try { return c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' }); } catch { return null; }
}

/** Description d'un coup (pour les deux camps) */
export function describeMove(m, who) {
  const mine = who === 'toi';
  const subj = mine ? 'Tu as' : "L'ordinateur a";
  const poss = mine ? ton : son;
  if (m.flags.includes('k') || m.flags.includes('q')) {
    return `${subj} roqué ${m.flags.includes('k') ? 'du côté du roi (petit roque)' : 'du côté de la dame (grand roque)'}. Le roi se met à l'abri et la tour entre dans le jeu.`;
  }
  let s = `${subj} joué ${poss(m.piece)} de ${m.from} en ${m.to}.`;
  if (m.captured) s += mine ? ` Tu as pris ${un(m.captured)}.` : ` Il a pris ${ton(m.captured)}.`;
  if (m.flags.includes('e')) s += ` C'est une prise en passant : un pion qui avance de deux cases peut être pris comme s'il n'avait avancé que d'une case.`;
  if (m.promotion) s += ` Le pion est arrivé au bout de l'échiquier : il se transforme en ${NAMES[m.promotion]} !`;
  return s;
}

/** Intention probable d'un coup, en langage simple */
export function intention(before, m, moveNumber) {
  const after = new Chess(before);
  after.move(m.san);
  const bits = [];
  if (after.isCheckmate()) return 'Échec et mat : le roi ne peut plus échapper.';
  if (after.inCheck()) bits.push(`C'est un échec : le roi est attaqué, il faut le protéger tout de suite.`);
  // pièces attaquées par la pièce qui vient de bouger
  const opp = m.color === 'w' ? 'b' : 'w';
  const threatened = hangingPieces(after, opp).filter((h) => h.by.includes(m.to));
  if (threatened.length) bits.push(`Cela menace ${le(threatened[0].type)} en ${threatened[0].square}.`);
  if (!bits.length) {
    if (m.piece === 'p' && ['d4', 'e4', 'd5', 'e5', 'c4', 'c5'].includes(m.to) && moveNumber < 12) bits.push('Ce pion prend de la place au centre : contrôler le centre, c’est avoir plus d’espace pour ses pièces.');
    else if ((m.piece === 'n' || m.piece === 'b') && ['1', '8'].includes(m.from[1]) && moveNumber < 20) bits.push('C’est un coup de développement : on sort les pièces de leur case de départ pour les mettre en jeu.');
    else if (m.captured) bits.push('Prendre du matériel donne un avantage.');
    else bits.push(`${NAMES[m.piece][0].toUpperCase() + NAMES[m.piece].slice(1)} se place sur une meilleure case.`);
  }
  return bits.join(' ');
}

/** Rappel de la règle de déplacement d'une pièce */
export const RULES = {
  p: 'Le pion avance tout droit d’une case, ou de deux depuis sa case de départ. Il prend en diagonale, vers l’avant.',
  n: 'Le cavalier se déplace en L : deux cases dans un sens, puis une sur le côté. C’est la seule pièce qui peut sauter par-dessus les autres.',
  b: 'Le fou se déplace en diagonale, aussi loin qu’il veut. Il reste toujours sur des cases de la même couleur.',
  r: 'La tour se déplace en ligne droite, horizontalement ou verticalement, aussi loin qu’elle veut.',
  q: 'La dame est la pièce la plus puissante : elle se déplace comme une tour et comme un fou réunis.',
  k: 'Le roi se déplace d’une seule case, dans toutes les directions. Il ne doit jamais rester en échec.',
};

export const TIPS = [
  'Au début, avance un pion du centre (e4 ou d4), puis sors tes cavaliers et tes fous.',
  'Pense à roquer tôt pour mettre ton roi à l’abri.',
  'Avant chaque coup, demande-toi : qu’est-ce que mon adversaire menace ?',
  'Ne sors pas ta dame trop tôt : elle se ferait chasser par les petites pièces.',
  'Vérifie que la case où tu vas est protégée, surtout pour tes pièces de valeur.',
  'Rappel des valeurs : pion 1, cavalier 3, fou 3, tour 5, dame 9.',
  'Cherche les échecs, les prises et les menaces : ce sont les coups les plus forts.',
];

/** Verdict sur un coup du joueur à partir des évaluations avant/après */
export function verdict({ beforeCp, afterCp, bestUci, beforeFen, move, reply }) {
  const drop = beforeCp - afterCp;
  const best = uciToMove(beforeFen, bestUci);
  const bestTxt = best ? `${le(best.piece)} en ${best.to}` : null;
  const isBest = best && best.from === move.from && best.to === move.to;
  if (isBest || drop < 40) {
    let why = '';
    if (move.captured) why = ` Tu gagnes ${un(move.captured)}.`;
    else if (move.flags.includes('k') || move.flags.includes('q')) why = ' Ton roi est maintenant à l’abri.';
    else if (move.san.includes('+')) why = ' Tu mets le roi adverse en échec.';
    return { level: 'good', short: isBest ? 'Excellent coup !' : 'Bon coup !', text: (isBest ? 'Excellent, c’est le meilleur coup !' : 'Bon coup.') + why };
  }
  if (drop < 150 || afterCp > 300) {
    return { level: 'ok', short: 'Coup correct', text: `Coup correct, mais il y avait mieux${bestTxt ? ` : jouer ${bestTxt}` : ''}.` };
  }
  let reason = 'Ta position devient plus difficile.';
  if (reply) {
    if (afterCp < -9000) reason = 'L’adversaire peut maintenant te faire échec et mat !';
    else if (reply.captured) reason = `L’adversaire peut maintenant prendre ${ton(reply.captured)} en ${reply.to}.`;
    else if (reply.san.includes('+')) reason = 'L’adversaire peut mettre ton roi en échec et gagner du matériel.';
  }
  return { level: 'bad', short: 'Attention, erreur', text: `Ce coup est une erreur. ${reason}${bestTxt ? ` Mieux valait jouer ${bestTxt}.` : ''}` };
}
