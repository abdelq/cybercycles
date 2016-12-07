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
  ai.nextMove(prevMoves);
});
