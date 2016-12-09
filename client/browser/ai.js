// Configurations
var room = 'abc123';

var direction = 'u'; // Déplacement de l'A.I.

var start = function (config) {
  console.log(config);
};

var next = function (prevMoves) {
  console.log(prevMoves);

  return direction;
};

var end = function (winnerID) {
  console.log(winnerID);
};
