/* Configuration */
const room = '';
const team = '';

/* Déplacement de l'A.I. */
var direction; // Valeurs acceptées : 'u', 'l', 'd', 'r'

/**
 * Fonction appelée en début de partie.
 *
 * @param {object} config Configuration de la grille de jeu
 */
function start(config) {
  console.log(config);
}

/**
 * Fonction appelée à chaque tour de jeu.
 *
 * @param {object} prevMoves Mouvements précédents des joueurs
 * @returns {string} Mouvement à effectuer
 */
function next(prevMoves) {
  console.log(prevMoves);

  return direction;
}

/**
 * Fonction appelée en fin de partie.
 *
 * @param {string} winnerID ID de l'équipe gagnante
 */
function end(winnerID) {
  console.log(winnerID);
}

// Ne pas modifier
module.exports = { room, team, start, next, end };
