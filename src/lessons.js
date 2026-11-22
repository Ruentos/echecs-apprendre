// Contenu de l'École.
// Types d'étapes :
//  info   : explication + position (fen) à regarder
//  tap    : toucher une case précise (target)
//  stars  : une pièce seule doit ramasser toutes les étoiles
//  puzzle : position réelle (fen), le coup est validé par accept(move, chess)

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const LESSONS = [
  {
    id: 'board', title: 'L’échiquier', sub: 'Le terrain de jeu et le but',
    steps: [
      { type: 'info', fen: '8/8/8/8/8/8/8/8 w - - 0 1', text: 'Voici l’échiquier : <b>64 cases</b>, claires et foncées. Les colonnes portent des lettres, de <b>a</b> à <b>h</b>. Les rangées portent des chiffres, de <b>1</b> à <b>8</b>.' },
      { type: 'tap', fen: '8/8/8/8/8/8/8/8 w - - 0 1', target: 'e4', text: 'Chaque case a un nom : sa lettre puis son chiffre. Touche la case <b>e4</b> : colonne e, rangée 4.' },
      { type: 'tap', fen: '8/8/8/8/8/8/8/8 w - - 0 1', target: 'b7', text: 'Bravo ! Maintenant, touche la case <b>b7</b>.' },
      { type: 'info', fen: START, text: 'Au départ, chaque camp a <b>16 pièces</b> : 8 pions, 2 tours, 2 cavaliers, 2 fous, une dame et un roi. <b>Les blancs commencent toujours.</b>' },
      { type: 'info', fen: START, marks: { e1: ['hint'], e8: ['hint'] }, text: 'Le but du jeu : attaquer le <b>roi</b> adverse de façon qu’il ne puisse plus s’échapper. C’est l’<b>échec et mat</b> ! Le roi ne se prend jamais.' },
    ],
  },
  {
    id: 'rook', title: 'La tour', sub: 'En ligne droite',
    steps: [
      { type: 'info', fen: '8/8/8/8/3R4/8/8/8 w - - 0 1', showMoves: 'd4', text: 'La <b>tour</b> se déplace en ligne droite : en avant, en arrière, à gauche ou à droite, <b>aussi loin qu’elle veut</b>. Les points montrent où elle peut aller.' },
      { type: 'stars', piece: 'wr', from: 'a1', stars: ['a5', 'e5', 'e8'], text: 'À toi ! Ramasse toutes les <b>étoiles</b> avec ta tour. Touche-la, puis touche une case.' },
      { type: 'stars', piece: 'wr', from: 'h1', stars: ['h6', 'c6', 'c2', 'f2'], text: 'Encore un parcours : ramasse les 4 étoiles.' },
    ],
  },
  {
    id: 'bishop', title: 'Le fou', sub: 'En diagonale',
    steps: [
      { type: 'info', fen: '8/8/8/8/3B4/8/8/8 w - - 0 1', showMoves: 'd4', text: 'Le <b>fou</b> se déplace en <b>diagonale</b>, aussi loin qu’il veut. Remarque : il reste toujours sur des cases de la <b>même couleur</b>.' },
      { type: 'stars', piece: 'wb', from: 'c1', stars: ['e3', 'g5', 'd8'], text: 'Ramasse les étoiles avec ton fou.' },
      { type: 'stars', piece: 'wb', from: 'f1', stars: ['b5', 'e8', 'h5', 'd1'], text: 'Un parcours plus long : 4 étoiles.' },
    ],
  },
  {
    id: 'queen', title: 'La dame', sub: 'La plus puissante',
    steps: [
      { type: 'info', fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1', showMoves: 'd4', text: 'La <b>dame</b> est la pièce la plus forte : elle se déplace comme une <b>tour</b> et comme un <b>fou</b> à la fois.' },
      { type: 'stars', piece: 'wq', from: 'd1', stars: ['d5', 'h1', 'a8'], text: 'Ramasse les étoiles avec ta dame. Elle va vite !' },
      { type: 'stars', piece: 'wq', from: 'a1', stars: ['g7', 'g2', 'b7', 'b4'], text: 'Encore 4 étoiles.' },
    ],
  },
  {
    id: 'king', title: 'Le roi', sub: 'Une case à la fois',
    steps: [
      { type: 'info', fen: '8/8/8/8/3K4/8/8/8 w - - 0 1', showMoves: 'd4', text: 'Le <b>roi</b> se déplace d’<b>une seule case</b>, dans toutes les directions. C’est la pièce la plus importante : si ton roi est mat, tu perds.' },
      { type: 'stars', piece: 'wk', from: 'e1', stars: ['d2', 'd3', 'e4', 'f4'], text: 'Promène ton roi jusqu’aux étoiles, une case à la fois.' },
    ],
  },
  {
    id: 'knight', title: 'Le cavalier', sub: 'Le saut en L',
    steps: [
      { type: 'info', fen: '8/8/8/8/3N4/8/8/8 w - - 0 1', showMoves: 'd4', text: 'Le <b>cavalier</b> se déplace en <b>L</b> : deux cases tout droit, puis une sur le côté. C’est la seule pièce qui peut <b>sauter</b> par-dessus les autres.' },
      { type: 'info', fen: '8/8/8/2PPP3/2PNP3/2PPP3/8/8 w - - 0 1', showMoves: 'd4', text: 'Même entouré de pions, le cavalier peut sauter par-dessus !' },
      { type: 'stars', piece: 'wn', from: 'b1', stars: ['c3', 'e4', 'f6', 'd7'], text: 'Ramasse les étoiles en sautant avec ton cavalier.' },
      { type: 'stars', piece: 'wn', from: 'g1', stars: ['h3', 'g5', 'e6', 'c5'], text: 'Un deuxième parcours. Prends ton temps.' },
    ],
  },
  {
    id: 'pawn', title: 'Le pion', sub: 'Petit mais courageux',
    steps: [
      { type: 'info', fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', showMoves: 'e2', text: 'Le <b>pion</b> avance tout droit, <b>d’une case</b>. Depuis sa case de départ, il peut avancer de <b>deux cases</b>. Il ne recule jamais.' },
      { type: 'puzzle', fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', text: 'Avance ton pion de <b>deux cases</b>.', accept: (m) => m.from === 'e2' && m.to === 'e4', wrong: 'Presque ! Fais-le avancer de deux cases d’un coup.' },
      { type: 'info', fen: '4k3/8/8/3p1p2/4P3/8/8/4K3 w - - 0 1', showMoves: 'e4', text: 'Attention, le pion <b>prend en diagonale</b>, vers l’avant. Et il ne peut pas avancer si une pièce le bloque.' },
      { type: 'puzzle', fen: '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', text: 'Prends le pion noir avec ton pion !', accept: (m) => !!m.captured, wrong: 'Le pion prend en diagonale. Essaie encore.' },
      { type: 'puzzle', fen: '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', text: 'Quand un pion arrive au bout de l’échiquier, il se <b>transforme</b> (promotion), le plus souvent en dame ! Avance ton pion jusqu’au bout.', accept: (m) => !!m.promotion, wrong: 'Avance le pion jusqu’à la dernière rangée.' },
    ],
  },
  {
    id: 'check', title: 'L’échec', sub: 'Attaquer le roi',
    steps: [
      { type: 'info', fen: '4k3/8/8/8/8/8/8/4R1K1 w - - 0 1', marks: { e8: ['check'] }, text: 'Quand le roi est attaqué, on dit qu’il est <b>en échec</b>. Ici, la tour blanche attaque le roi noir sur la colonne e.' },
      { type: 'puzzle', fen: '4k3/8/8/8/8/8/8/R5K1 w - - 0 1', text: 'Mets le roi noir <b>en échec</b> avec ta tour.', accept: (m, c) => c.inCheck(), wrong: 'Ce coup n’attaque pas le roi. Mets ta tour sur la même ligne ou colonne que lui.' },
      { type: 'info', fen: '4k3/4r3/8/8/8/8/8/3QK3 w - - 0 1', marks: { e1: ['check'] }, text: 'Quand <b>ton</b> roi est en échec, tu dois le sauver tout de suite. Trois façons : <b>1.</b> déplacer le roi, <b>2.</b> mettre une pièce devant, <b>3.</b> prendre l’attaquant.' },
      { type: 'puzzle', fen: '4k3/4r3/8/8/8/8/8/3QK3 w - - 0 1', text: 'Ton roi est en échec par la tour. <b>Sauve-le !</b> Tous les coups possibles sont des sauvetages.', accept: () => true },
    ],
  },
  {
    id: 'mate', title: 'Échec et mat', sub: 'Gagner la partie',
    steps: [
      { type: 'info', fen: 'R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1', marks: { g8: ['check'] }, text: '<b>Échec et mat</b> : le roi est en échec et <b>aucun coup</b> ne peut le sauver. La partie est gagnée ! Ici, le roi noir est bloqué par ses propres pions.' },
      { type: 'puzzle', fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', text: 'Fais <b>échec et mat</b> en un coup.', accept: (m, c) => c.isCheckmate(), wrong: 'Pas encore mat. Cherche la dernière rangée…' },
      { type: 'puzzle', fen: '7k/8/6K1/8/8/8/8/Q7 w - - 0 1', text: 'Avec ta dame et ton roi : <b>mat en un coup</b>.', accept: (m, c) => c.isCheckmate(), wrong: 'Le roi noir peut encore s’échapper. Cherche une autre case.' },
      { type: 'puzzle', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', text: 'Le célèbre « coup du berger » : la dame et le fou visent la même case. <b>Mat en un coup !</b>', accept: (m, c) => c.isCheckmate(), wrong: 'Regarde la case f7 : elle n’est défendue que par le roi.' },
    ],
  },
  {
    id: 'castle', title: 'Le roque', sub: 'Mettre son roi à l’abri',
    steps: [
      { type: 'info', fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', text: 'Le <b>roque</b> est un coup spécial : le roi va de <b>deux cases</b> vers une tour, et la tour saute de l’autre côté du roi. Le roi est ainsi à l’abri.' },
      { type: 'info', fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', text: 'Conditions : ni le roi ni la tour n’ont encore bougé, aucune pièce entre eux, et le roi n’est pas en échec et ne traverse pas une case attaquée.' },
      { type: 'puzzle', fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', text: 'Fais le <b>petit roque</b> : déplace ton roi de deux cases vers la droite (en g1).', accept: (m) => m.flags.includes('k'), wrong: 'Touche le roi et amène-le en g1.' },
      { type: 'puzzle', fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', text: 'Maintenant le <b>grand roque</b> : roi de deux cases vers la gauche (en c1).', accept: (m) => m.flags.includes('q'), wrong: 'Touche le roi et amène-le en c1.' },
    ],
  },
  {
    id: 'enpassant', title: 'La prise en passant', sub: 'La règle secrète du pion',
    steps: [
      { type: 'info', fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', marks: { d5: ['last'], d7: ['last'] }, text: 'Le pion noir vient d’avancer de deux cases, de d7 à d5, et se retrouve à côté de ton pion. Tu as le droit de le prendre <b>comme s’il n’avait avancé que d’une case</b> !' },
      { type: 'puzzle', fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', text: 'Prends <b>en passant</b> : ton pion va en d6 et le pion noir disparaît. Attention, c’est possible uniquement juste après son avancée.', accept: (m) => m.flags.includes('e'), wrong: 'Amène ton pion en d6, en diagonale.' },
    ],
  },
  {
    id: 'draw', title: 'Pat et partie nulle', sub: 'Quand personne ne gagne',
    steps: [
      { type: 'info', fen: 'k7/2K5/1Q6/8/8/8/8/8 b - - 0 1', text: '<b>Pat</b> : c’est aux noirs de jouer, leur roi n’est <b>pas</b> en échec, mais il n’a <b>aucun coup</b> possible. La partie est <b>nulle</b>. C’est un piège à éviter quand on gagne !' },
      { type: 'puzzle', fen: 'k7/2K5/8/8/8/8/8/1Q6 w - - 0 1', text: 'Fais <b>mat</b>, sans faire pat !', accept: (m, c) => c.isCheckmate(), wrong: (m, c) => (c.isStalemate() ? 'Oups, c’est pat : le roi noir n’a plus de coup mais n’est pas en échec. Réessaie !' : 'Pas encore mat. Réessaie.') },
      { type: 'info', fen: '8/8/4k3/8/8/4K3/8/8 w - - 0 1', text: 'Autres parties nulles : quand il ne reste que les deux rois, quand la même position revient trois fois, ou quand les deux joueurs sont d’accord.' },
    ],
  },
  {
    id: 'tips', title: 'Premiers conseils', sub: 'Valeur des pièces et stratégie',
    steps: [
      { type: 'info', fen: '8/8/8/8/8/8/8/8 w - - 0 1', text: '<b>Valeur des pièces</b> : pion = 1, cavalier = 3, fou = 3, tour = 5, dame = 9. Le roi n’a pas de prix. Évite d’échanger une pièce forte contre une plus faible.' },
      { type: 'puzzle', fen: '4k3/8/2r5/1p6/3N4/8/8/4K3 w - - 0 1', text: 'Ton cavalier peut prendre deux pièces. Prends <b>la plus précieuse</b>.', accept: (m) => m.captured === 'r', wrong: 'Ça marche, mais la tour vaut 5 alors que le pion vaut 1 !' },
      { type: 'info', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', text: '<b>Trois conseils pour bien commencer :</b> 1. Occupe le <b>centre</b> avec un pion. 2. <b>Sors</b> tes cavaliers et tes fous. 3. <b>Roque</b> tôt pour protéger ton roi.' },
      { type: 'puzzle', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', text: 'Tes pièces sont sorties. Que faire maintenant ? Mets ton roi à l’abri !', accept: (m) => m.flags.includes('k'), wrong: 'Pense au roque : roi en g1.' },
      { type: 'info', fen: START, text: 'Tu connais maintenant toutes les règles. 🎉 Va jouer contre <b>Léon</b>, et n’oublie pas : le bouton <b>🔊 Explique</b> et l’<b>💡 Indice</b> sont là pour t’aider.' },
    ],
  },
];
