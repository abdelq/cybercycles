var socket = io();
var room = window.location.pathname.slice(1);
var context = canvas.getContext("2d");

// Canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Document title
document.title = "CyberCycles - " + room;

socket.on('connect', function () {
  socket.emit('join', room);
});

socket.on('start', function (config) {
  console.log(config);
});

socket.on('next', function (prevMoves) {
  console.log(prevMoves);
});

socket.on('end', function (winnerID) {
  console.log(winnerID);
});

socket.on('disconnect', function () {
});
