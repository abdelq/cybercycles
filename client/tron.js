var io = require('socket.io-client');
var socket = io('http://localhost:1337');

var ai = require('./ai');

socket.on('connect', function () {
  socket.emit('join', ai.room);
});

socket.on('start', function (config) {
  ai.createGrid(config);
});

socket.on('nextMove', function (prevMoves) {
  socket.emit('move', ai.nextMove(prevMoves));
});

socket.on('end', function (winnerID) {
  ai.victory(winnerID);
});
