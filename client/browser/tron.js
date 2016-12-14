const socket = io('http://localhost:1337');

socket.on('connect', () => {
  socket.emit('join', room, team);
});

socket.on('start', (config) => {
  start(config);
});

socket.on('nextMove', (prevMoves) => {
  socket.emit('move', next(prevMoves));
});

socket.on('end', (teamID) => {
  end(teamID);
});

document.querySelector('iframe').setAttribute('src', `http://localhost:1337/rooms/${room}`);
