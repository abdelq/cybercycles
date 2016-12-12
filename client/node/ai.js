// Config
var room = 'abc123';
var team = 'coolkids';

var direction = 'u'; // Déplacement de l'A.I.

function start(config) {
  console.log(config);
}

function next(prevMoves) {
  console.log(prevMoves);

  return direction;
}

function end(winnerID) {
  console.log(winnerID);
}

module.exports = {
  room,
  team,
  start,
  next,
  end,
};
