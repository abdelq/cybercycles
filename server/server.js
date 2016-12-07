let app = require('express');
let server = require('http').Server(app);
let io = require('socket.io')(server);

let config = require('./config');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function setObstacles(amount, gridW, gridH) {
  let obstacles = [];

  for (let i = 0; i < amount; i += 1) {
    let ob1 = {
      x: randomInt(0, gridW),
      y: randomInt(0, gridH),
      w: randomInt(2, 6),
      h: randomInt(2, 6)
    };

    // Symétrie
    let ob2 = {
      x: gridW - ob1.w - ob1.x,
      y: gridH - ob1.h - ob1.y,
      w: ob1.w,
      h: ob1.h
    };

    obstacles.push(ob1, ob2);
  }

  return obstacles;
}

function getPlayers(room) {
  let players = [];

  for (let socketID in room.sockets) {
    let socket = io.sockets.connected[socketID];

    players.push(socket.state);
  }

  return players;
}

function setPlayers(room, gridW, gridH) {
  let x;
  let y;

  do {
    x = randomInt(0, Math.round(gridW/4));
    y = randomInt(0, gridH - 1);
  } while(room.grid[y][x] !== 0);

  let players = getPlayers(room);

  players.forEach(player => {
    if (player.id % 2) {
      player.x = x;
      player.y = y;
    } else {
      player.x = gridW - x - 1;
      player.y = gridH - y - 1;
    }
  });

  return players;
}

function start(room) {
  // Dimensions
  let w = randomInt(30, 40);
  let h = randomInt(18, 30);

  room.grid = Array(h).fill().map(() => Array(w).fill(0));

  // Obstacles
  let obstacles = setObstacles(randomInt(2, 6), w, h);

  obstacles.forEach(ob => {
    for (var x = (ob.x + ob.w) - 1; x >= ob.x; x -= 1) {
      for (var y = (ob.y + ob.h) - 1; y >= ob.y; y -= 1) {
        if (y >= 0 && x >= 0 && y < h && x < w) {
          room.grid[y][x] = -1;
        }
      }
    }
  });

  // Joueurs
  let players = setPlayers(room, w, h);

  players.forEach(player => room.grid[player.y][player.x] = player.id);

  for (let socketID in room.sockets) {
    let socket = io.sockets.connected[socketID];

    socket.emit('start', {
      players: players,
      obstacles: obstacles,
      w: w,
      h: h,
      me: socket.state.id
    });
  }

  io.to(room).emit('nextMove', []);
}

function step(room) {
}

io.on('connection', function (socket) {
  socket.on('join', function (roomID) {
    socket.join(roomID);

    let room = io.sockets.adapter.rooms[roomID];
    room.lastID ? room.lastID += 1 : room.lastID = 1;

    socket.state = {
      id: room.lastID,
      x: 0,
      y: 0,
      direction: room.lastID % 2 ? 'u' : 'd'
    };

    console.log(`Client ${socket.id} joined ${roomID}`);

    if (room.length === 2) {
      start(room);
      setTimeout(function () {
        step(room);
      }, config.initDelay);
    }
  });
});

server.listen(config.port);
console.log(`Server started on port ${config.port}`);
