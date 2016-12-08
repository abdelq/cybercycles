let io = require('socket.io-client');
let socket = io('http://localhost:1337');

let ai = require('./ai');

socket.on('connect', function () {
  socket.emit('join', ai.room);
});

socket.on('start', function (config) {
  ai.createGrid(config);
});

socket.on('nextMove', function (prevMoves) {
  let direction = ai.nextMove(prevMoves);

  socket.emit('move', direction);
});

socket.on('end', function (winnerID) {
  ai.victory(winnerID);
});
