const io = require('socket.io-client');

const ai = require('./ai');

const socket = io('http://localhost:1337');

socket.on('connect', () => {
  socket.emit('join', ai.room);
});

socket.on('start', (config) => {
  ai.createGrid(config);
});

socket.on('nextMove', (prevMoves) => {
  socket.emit('move', ai.nextMove(prevMoves));
});

socket.on('end', (winnerID) => {
  ai.victory(winnerID);
});
