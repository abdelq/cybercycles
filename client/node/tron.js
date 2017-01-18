var io = require('socket.io-client');
var ai = require('./ai');

var socket = io('http://localhost:1337');

socket.on('connect', function () {
  socket.emit('join', ai.room, ai.team);
});

socket.on('start', function (config) {
  ai.start(config);
});

socket.on('next', function (prevMoves) {
  socket.emit('move', ai.next(prevMoves));
});

socket.on('view', function (grid) {
  console.log(grid);
});

socket.on('end', function (winnerID) {
  ai.end(winnerID);
  process.exit();
});
