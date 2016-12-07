let io = require('socket.io-client');
let socket = io('http://localhost:1337');

let room = require('./index').room;

socket.on('connect', function () {
  socket.emit('join', room);
});

module.exports = {
  io: io,
  socket: socket
};
