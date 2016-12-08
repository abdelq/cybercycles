let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);

let config = require('./config');

app.get('/', function (req, res) {
  // Redirection vers la page d'accueil du Hackathon
  res.redirect(config.server.homepage);
});

// TODO Explain here
// TODO Code the web player
app.get('/rooms/:id', function (req, res) {
  let room = io.sockets.adapter.rooms[req.params.id];

  room ? res.send(room.grid) : res.sendStatus(404);
});

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function setObstacles(amount, grid) {
  let obstacles = [];
  let conf = config.obstacles;

  for (let i = 0; i < amount; i += 1) {
    let ob = {
      x: randomInt(0, grid.w),
      y: randomInt(0, grid.h),
      w: randomInt(conf.w.min, conf.w.max),
      h: randomInt(conf.h.min, conf.h.max)
    };

    obstacles.push(ob);

    if (conf.symetrical) {
      ob.x = grid.w - ob.w - ob.x > 0 ? grid.w - ob.w - ob.x : 0;
      ob.y = grid.h - ob.h - ob.y > 0 ? grid.h - ob.h - ob.y : 0;

      obstacles.push(ob);
    }
  }

  return obstacles;
}

function getSockets(room) {
  let sockets = [];

  for (let id in room.sockets) {
    sockets.push(io.sockets.connected[id]);
  }

  return sockets;
}

function getPlayers(room) {
  return getSockets(room).map(socket => socket.state);
}

function setPlayers(room, grid) {
  let x;
  let y;

  do {
    x = randomInt(0, Math.round(grid.w / 4));
    y = randomInt(0, grid.h - 1);
  } while (room.grid[y][x] !== 0);

  let players = getPlayers(room);

  // TODO Fix issue with modulo and new ids
  // TODO Teams
  players.forEach(player => {
    if (player.id % 2) {
      player.x = x;
      player.y = y;
    } else {
      player.x = grid.w - x - 1;
      player.y = grid.h - y - 1;
    }
  });

  return players;
}

function setGrid(grid, x, y, val) {
  if (y >= 0 && x >= 0 && y < grid.length && x < grid[y].length) {
    grid[y][x] = val;
  }
}

function getRoomID(room) {
  let rooms = io.sockets.adapter.rooms;

  return Object.keys(rooms).find(id => rooms[id] === room);
}

// TODO Config syntax is ugly all over the code
function start(room) {
  // Grille
  let w = randomInt(config.grid.w.min, config.grid.w.max);
  let h = randomInt(config.grid.h.min, config.grid.h.max);

  room.grid = Array(h).fill().map(() => Array(w).fill(0));

  // Obstacles
  let obAmount = randomInt(config.obstacles.amount.min, config.obstacles.amount.max);
  let obstacles = setObstacles(obAmount, {w: w, h: h});

  obstacles.forEach(ob => {
    for (var x = (ob.x + ob.w) - 1; x >= ob.x; x -= 1) {
      for (var y = (ob.y + ob.h) - 1; y >= ob.y; y -= 1) {
        setGrid(room.grid, x, y, -1);
      }
    }
  });

  // Joueurs
  let players = setPlayers(room, {w: w, h: h});

  players.forEach(p => setGrid(room.grid, p.x, p.y, p.id));

  // Envoi de l'information
  let roomID = getRoomID(room);

  getSockets(room).forEach(socket => {
    socket.emit('start', {
      players: players,
      obstacles: obstacles,
      w: w,
      h: h,
      me: socket.state.id
    });
  });

  io.to(roomID).emit('nextMove', []);
}

// TODO Review
/*
function isEmptyCell(grid, x, y) {
  return y >= 0 && x >= 0 &&
    y < grid.length && x < grid[0].length &&
    grid[y][x] == 0;
}
*/

function step(room) {
  let players = getPlayers(room);

  // Mise à jour de la position
  players.forEach(p => {
    switch (p.direction) {
      case 'u': p.y -= 1; break;
      case 'l': p.x -= 1; break;
      case 'd': p.y += 1; break;
      case 'r': p.x += 1; break;
    }
  });

  // TODO Review from this to the end of function
  // Test si collision
  if (players[0].x == players[1].x &&
    players[0].y == players[1].y) {
    // Fix undefined error
    room.grid[players[0].y][players[1].x] = -2;

    players[0].dead = true;
    players[1].dead = true;
  } else {
    players.forEach(player => {
      if (isEmptyCell(room.grid, player.x, player.y)) {
        room.grid[player.y][player.x]  = player.id;
      } else {
        if (player.y >= 0 && player.x >= 0 && player.y < room.grid.length && player.x < room.grid[0].length) {
          room.grid[player.y][player.x]  = -2;
        }
        player.dead = true;
      }
    });
  }

  let alive = players.filter(p => !p.dead);

  let directions = players.map(p => {
    return {
      id: p.id,
      direction: p.direction
    }
  });

  let rooms = io.sockets.adapter.rooms;
  let roomID = Object.keys(rooms).find(id => rooms[id] === room);
  io.to(roomID).emit('nextMove', directions);

  // TODO Think about death related logic
  // Kick out loser maybe?
  // socket.leave(?)
  if (alive.length == 2) {
    setTimeout(function () {
      step(room);
    }, config.delays.default);
  } else if (alive.length == 1) {
    // console.log();
    io.to(roomID).emit('end', alive[0].id);
  } else if (alive.length == 0) {
    // console.log();
    io.to(roomID).emit('end', false);
  }
}

io.on('connection', function (socket) {
  socket.on('join', function (roomID) {
    socket.join(roomID);

    // TODO Rewrite ID system to fix issues + add teams
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
      }, config.delays.init);
    }
  });

  socket.on('move', function (direction) {
    if ('uldr'.indexOf(direction) !== -1) {
      socket.state.direction = direction;
    }
  });

  socket.on('disconnecting', function () {
    for (let roomID in socket.rooms) {
      let room = io.sockets.adapter.rooms[roomID];

      if (room.length > 1) {
        let winner = getPlayers(room).find(p => p.id !== socket.state.id);

        io.to(roomID).emit('end', winner.id);

        // TODO Include real ID of winner
        console.log(`Client ${socket.id} (${socket.state.id}) left ${roomID}\nThe winner is (${winner.id})`);
      }
    }
  });
});

server.listen(config.server.port, function () {
  console.log(`Server started on port ${config.server.port}`);
});
