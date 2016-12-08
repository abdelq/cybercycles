// Configurations
var room = 'abc123';

var grid; // Grille de jeu
var direction = 'u'; // Déplacement de l'A.I.

var createGrid = function (config) {
  console.log(config);
};

var nextMove = function (prevMoves) {
  console.log(prevMoves);

  return direction;
};

var victory = function (winnerID) {
  console.log(winnerID);
};

module.exports = {
  room: room,
  createGrid: createGrid,
  nextMove: nextMove,
  victory: victory,
};
