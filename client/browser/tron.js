const socket = io('http://localhost:1337');

socket.on('connect', () => {
  socket.emit('join', room);
});

socket.on('start', (config) => {
  start(config);
});

socket.on('nextMove', (prevMoves) => {
  let move = next(prevMoves);
  socket.emit('move', move);
});

socket.on('end', (winnerID) => {
  end(winnerID);
});

document.querySelector('iframe').setAttribute('src', `http://localhost:1337/rooms/${room}`);
