const io = require('socket.io-client');
const open = require('opn');

const ai = require('./ai');

const socket = io('http://localhost:1337');

socket.on('connect', () => {
  socket.emit('join', ai.room);
});

socket.on('start', (config) => {
  ai.createGrid(config);
  open(`http://localhost:1337/rooms/${ai.room}`);
});

socket.on('nextMove', (prevMoves) => {
  let move = ai.nextMove(prevMoves);
  socket.emit('move', move);
});

socket.on('end', (winnerID) => {
  ai.victory(winnerID);
});
