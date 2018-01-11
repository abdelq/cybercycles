/* Configuration */
const room = '';
const team = '';

/* Déplacement de l'A.I. */
const directions = Object.freeze(['u', 'l', 'd', 'r']);
let direction;

/**
 * Fonction appelée en début de partie.
 *
 * @param config Configuration de la grille de jeu
 */
function start(config) {
    console.log("Joueurs : " + config.players);

    console.log("Obstacles : " + config.obstacles);

    console.log("Taille de la grille : " + config.w + " x " + config.h);

    console.log("Votre identifiant : " + config.me);
}

/**
 * Fonction appelée à chaque tour de jeu.
 *
 * @param prevMoves Mouvements précédents des joueurs
 * @return Mouvement à effectuer
 */
function next(prevMoves) {
    console.log("Mouvements précdents : " + prevMoves.join(" "));

    // Choisis une direction au hasard
    direction = directions[Math.floor(Math.random() * directions.length)];
    console.log("Mouvement choisi : " + direction);

    return direction;
}

/**
 * Fonction appelée en fin de partie.
 *
 * @param winnerID ID de l'équipe gagnante
 */
function end(winnerID) {
    console.log("Équipe gagnante : " + winnerID);
}

// Ne pas modifier
module.exports = { room, team, start, next, end };
