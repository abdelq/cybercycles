// Config
var room;
var team;

// Déplacement de l'A.I.
// Peut être: 'u', 'l', 'd', 'r'
var direction = 'u';

/**
 * Fonction appelée en début de partie.
 *
 * @param {object} config Configuration de la grille de jeu
 */
function start(config) {
  console.log('Configuration: ' + config);
}

/**
 * Fonction appelée à chaque tour de jeu.
 *
 * @param {object} prevMoves Mouvements précédents des joueurs
 */
function next(prevMoves) {
  console.log('Mouvements: ' + prevMoves);

  return direction;
}

/**
 * Fonction appelée en fin de partie.
 *
 * @param {any} winnerID ID de l'équipe gagnante
 */
function end(winnerID) {
  console.log('Vainqueur(s): ' + winnerID);
}

module.exports = {
  room, team, start, next, end,
};
