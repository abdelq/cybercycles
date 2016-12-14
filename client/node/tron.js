const io = require('socket.io-client');
const ai = require('./ai');

const socket = io('http://localhost:1337');

socket.on('connect', () => {
  socket.emit('join', ai.room, ai.team);
});

socket.on('start', (config) => {
  ai.start(config);
});

socket.on('nextMove', (prevMoves) => {
  socket.emit('move', ai.next(prevMoves));
});

socket.on('end', (teamID) => {
  ai.end(teamID);
  process.exit();
});
