# ♔ Plan — Appli d'échecs pour débutant (V1)

## Objectif
Une appli web installable sur téléphone (PWA), élégante, pour apprendre les échecs de zéro, avec une voix féminine qui explique à la demande.

## Choix techniques
| Besoin | Outil | Pourquoi |
|---|---|---|
| Interface | HTML/CSS/JS (Vite + TypeScript) | Léger, rapide sur mobile |
| Règles du jeu | `chess.js` | Coups légaux, échec, mat, roque, en passant, promotion |
| Échiquier | Composant maison (SVG) | Contrôle total du style élégant et des animations |
| Ordinateur adversaire | Stockfish (WebAssembly, dans un Web Worker) | Fort, gratuit, réglable en niveaux, hors ligne |
| Voix | Web Speech API (voix FR féminine du téléphone) | Gratuit, hors ligne — branchement « voix premium » prévu pour plus tard |
| Installation / hors ligne | Manifest + Service Worker | Icône sur l'écran d'accueil, plein écran |
| Sauvegarde | `localStorage` | Progression conservée sur le téléphone |

## Design
- Palette : ivoire `#F5F0E6`, vert profond `#2F4A3A`, bois clair/foncé pour les cases, accent doré `#C9A45C`.
- Typo : serif élégante pour les titres (ex. Cormorant), sans-serif lisible pour le texte (ex. Inter).
- Pièces classiques fines (jeu SVG libre de droits).
- Portrait, une main : échiquier en haut, barre d'actions en bas (🔊 Explique · 💡 Indice · ↩️ Annuler).
- Animations douces (déplacement 200 ms), vibration légère à la pose.

## Écrans
1. **Accueil** — « École », « Jouer », progression (jauge dorée).
2. **École** — liste des leçons, cadenas sur les suivantes.
3. **Leçon** — explication + mini-défi interactif.
4. **Partie** — échiquier, aides, barre d'actions.
5. **Fin de partie** — résultat, conseil du coach, « Rejouer ».
6. **Réglages** — voix (choix, vitesse), sons, vibrations.

## Contenu de l'École (V1)
1. L'échiquier et le but du jeu
2. La tour — défi : ramasser les étoiles
3. Le fou
4. La dame
5. Le roi
6. Le cavalier (le saut en L)
7. Le pion (avance, prise, promotion)
8. Échec, et comment s'en sortir
9. Échec et mat (mat en 1 simples)
10. Le roque
11. La prise en passant
12. Pat et partie nulle
13. Valeur des pièces et premiers conseils (centre, développement, roi à l'abri)

Chaque leçon : texte court + voix + 1 à 3 mini-défis. Une étoile par défi réussi.

## Partie contre l'ordinateur
- **3 niveaux** : Débutant (coups faibles volontaires), Intermédiaire, Confirmé.
- **Aides activables** :
  - cases possibles surlignées au toucher ;
  - alertes : « ta pièce est attaquée », « ce coup laisse une pièce sans défense » ;
  - indice en 3 paliers : quelle pièce → quelle zone → le coup ;
  - annuler illimité.
- Choix des blancs ou des noirs.

## La voix « 🔊 Explique-moi »
Selon le contexte, elle explique :
- **en leçon** : la règle en cours ;
- **en partie** : le dernier coup de l'ordi (pièce, intention simple : attaque, défense, développement) ;
- **après ton coup** : bon / imprécis / erreur, et pourquoi en une phrase (via l'évaluation Stockfish) ;
- **règle spéciale** quand elle survient (roque, en passant, promotion, échec).

Les phrases sont générées à partir de modèles en français (pas d'IA en ligne).
La voix choisie automatiquement : voix FR féminine la plus naturelle disponible sur le téléphone, modifiable dans les réglages.

## Étapes de construction
1. **Socle** — projet Vite + TS, PWA (manifest, icône, hors ligne), thème et typographies.
2. **Échiquier** — affichage SVG, toucher/glisser, coups légaux, animations, promotion.
3. **Moteur** — Stockfish en Web Worker, 3 niveaux, partie complète jouable.
4. **Aides** — surlignage, alertes de danger, indices, annuler.
5. **Voix** — service de synthèse + modèles de phrases + bouton Explique.
6. **École** — moteur de leçons + les 13 leçons et leurs défis.
7. **Progression** — étoiles, sauvegarde locale, écran d'accueil.
8. **Finitions & tests** — test sur vrai téléphone (iPhone + Android), lisibilité, performance.

## Plus tard (V2)
Puzzles quotidiens, badges, analyse de mes parties, partie à deux, voix premium, ouvertures commentées.

## Comment tu l'utiliseras
Je la lance sur ton PC ; tu ouvres l'adresse affichée sur ton téléphone (même Wi-Fi), puis « Ajouter à l'écran d'accueil ». Pour l'utiliser partout, on pourra la mettre en ligne gratuitement (ex. GitHub Pages / Netlify).
