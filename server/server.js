let app = require('express');
let server = require('http').Server(app);
let io = require('socket.io')(server);

let config = require('./config');

io.on('connection', function (socket) {
  socket.on('join', function (room) {
    socket.join(room);
  });
});

server.listen(config.port);
