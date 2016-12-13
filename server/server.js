const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const conf = require('./config');

const testMode = process.argv.indexOf('--test') !== -1;

app.get('/', (req, res) => {
  // Redirection vers la page d'accueil du Hackathon
  res.redirect(conf.server.homepage);
});

// Visionnement web
app.get('/rooms/:id', (req, res) => {
  const room = io.sockets.adapter.rooms[req.params.id];

  if (room) {
    res.send(room.grid);
  } else {
    res.sendStatus(404);
  }
});

function getSockets(room) {
  return Object.keys(room.sockets).map(id =>
    io.sockets.connected[id]
  );
}

function getPlayers(room) {
  // Maybe filter depending if they have a state or not
  return getSockets(room).map(socket => socket.state);
}

function getRoomID(room) {
  const rooms = io.sockets.adapter.rooms;

  return Object.keys(rooms).find(id => rooms[id] === room);
}

// TODO Test again w/ different ways/vars
function kickSockets(room) {
  const roomID = getRoomID(room);

  getSockets(room).forEach((socket) => {
    socket.leave(roomID);
  });
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function setGrid(grid, x, y, val) {
  if (y >= 0 && x >= 0 && y < grid.length && x < grid[y].length) {
    grid[y][x] = val;
  }
}

// TODO grid is a bad parameter name
function setObstacles(amount, grid) {
  const obstacles = [];

  for (let i = 0; i < amount; i += 1) {
    const ob = {
      x: randomInt(0, grid.w),
      y: randomInt(0, grid.h),
      w: randomInt(conf.obstacles.w.min, conf.obstacles.w.max),
      h: randomInt(conf.obstacles.h.min, conf.obstacles.h.max),
    };

    obstacles.push(ob);

    if (conf.obstacles.symetrical) {
      const obSym = {
        x: grid.w - ob.w - ob.x > 0 ? grid.w - ob.w - ob.x : 0,
        y: grid.h - ob.h - ob.y > 0 ? grid.h - ob.h - ob.y : 0,
        w: ob.w,
        h: ob.h,
      };

      obstacles.push(obSym);
    }
  }

  return obstacles;
}

// TODO grid is a bad parameter name
function setPlayers(room, grid) {
  /*
  let x;
  let y;

  do {
    x = testMode ? 0 : randomInt(0, Math.round(grid.w / 4));
    y = testMode ? 0 : randomInt(0, grid.h - 1);
  } while (room.grid[y][x] !== 0);

  const players = getPlayers(room);

  players.forEach((player) => {
    if (player.id % 2) {
      player.x = x;
      player.y = y;
    } else {
      player.x = grid.w - x - 1;
      player.y = grid.h - y - 1;
    }
  });

  return players;
  */
}

function start(room) {
  // Grille
  const w = randomInt(conf.grid.w.min, conf.grid.w.max);
  const h = randomInt(conf.grid.h.min, conf.grid.h.max);

  room.grid = Array(h).fill().map(() => Array(w).fill(0));

  // Obstacles
  const obAmount = testMode ? 0 : randomInt(conf.obstacles.amount.min, conf.obstacles.amount.max);
  const obstacles = setObstacles(obAmount, { w, h });

  // TODO This should be called in setObstacles
  obstacles.forEach((ob) => {
    for (let x = (ob.x + ob.w) - 1; x >= ob.x; x -= 1) {
      for (let y = (ob.y + ob.h) - 1; y >= ob.y; y -= 1) {
        setGrid(room.grid, x, y, -1);
      }
    }
  });

  // Joueurs
  const players = setPlayers(room, { w, h });

  // TODO This should be called in setPlayers
  players.forEach(p => setGrid(room.grid, p.x, p.y, p.id));

  // Envoi de l'information
  const roomID = getRoomID(room);

  getSockets(room).forEach((socket) => {
    socket.emit('start', {
      players,
      obstacles,
      w,
      h,
      me: socket.state.id,
    });
  });

  io.to(roomID).emit('nextMove', []);
}

/*
function isEmpty(grid, x, y) {
  return y >= 0 && x >= 0 &&
         y < grid.length && x < grid[y].length &&
         grid[y][x] === 0;
}
*/

function step(room) {
  const players = getPlayers(room);

  if (players.length < 2) {
    return;
  }

  // Mise à jour de la position
  players.forEach((p) => {
    switch (p.direction) {
      case 'u': p.y -= 1; break;
      case 'l': p.x -= 1; break;
      case 'd': p.y += 1; break;
      case 'r': p.x += 1; break;
      default: break;
    }
  });

  // Test de collisions
  if (players[0].x === players[1].x &&
      players[0].y === players[1].y) {
    // Contre les joueurs
    setGrid(room.grid, players[0].x, players[0].y, -2);

    players[0].dead = true;
    players[1].dead = true;
  } else {
    // Contre un obstacle
    players.forEach((player) => {
      if (isEmpty(room.grid, player.x, player.y)) {
        setGrid(room.grid, player.x, player.y, player.id);
      } else {
        setGrid(room.grid, player.x, player.y, -2);

        player.dead = true;
      }
    });
  }

  const roomID = getRoomID(room);

  // Envoi des directions
  const directions = players.map(p =>
     ({
       id: p.id,
       direction: p.direction,
     })
  );

  io.to(roomID).emit('nextMove', directions);

  // Gestion de mort
  const alive = players.filter(p => !p.dead);

  if (alive.length === 2) {
    setTimeout(() => {
      step(room);
    }, conf.delays.default);
  } else if (alive.length === 1) {
    io.to(roomID).emit('end', alive[0].id);
    kickSockets(room);
    console.log(`Match ended in room: ${roomID}. Winner: ${alive[0].id}.`);
  } else if (alive.length === 0) {
    io.to(roomID).emit('end', 0);
    kickSockets(room);
    console.log(`Match ended in room: ${roomID}. Tie.`);
  }
}

io.on('connection', (socket) => {
  socket.on('join', (roomID, teamID) => {
    socket.join(roomID);

    const room = io.sockets.adapter.rooms[roomID];
    let teams = room.teams ? room.teams : room.teams = {};
    let lastID = room.lastID ? room.lastID += 1 : room.lastID = 1;

    // Teams
    if (Object.keys(teams).length < conf.teams.amount) {
      if (!teamID) {
        teamID = lastID;
      }

      let team = teams[teamID];
      if (!team) {
        teams[teamID] = [socket];
      } else if (team.length < conf.teams.size) {
        team.push(socket);
      } else {
        teamID = null;
      }
    } else {
      teamID = null;
    }

    // Player
    socket.state = {
      id: lastID,
      x: 0,
      y: 0,
      team: teamID,
      // TODO Give proper move after I finish positionning
      // direction: room.lastID % 2 ? 'u' : 'd',
    };

    console.log(`Client ${socket.id} (id: ${socket.state.id}, team: ${socket.state.team}) joined ${roomID}`);

    let fullTeams = Object.keys(teams).filter((id) => {
      return teams[id].length == conf.teams.size;
    });

    if (fullTeams.length == conf.teams.amount) {
      // start(room);
      // setTimeout(() => step(room), conf.delays.init);
    }
  });

  socket.on('move', (direction) => {
    const player = socket.state;

    if ('uldr'.indexOf(direction) !== -1) {
      player.direction = direction;
    }
  });

  socket.on('disconnecting', () => {
    let roomID = Object.keys(socket.rooms).find(id => id !== socket.id);
    let room = io.sockets.adapter.rooms[roomID];

    // Match isn't started yet
    if (!room.grid) {
      if (socket.state.team) {
        // Removes the player from his team
        let team = room.teams[socket.state.team];
        team.splice(team.indexOf(socket), 1);

        // Deletes the team if empty
        if (team.length == 0) {
          delete room.teams[socket.state.team]; 
        }
      }
    }

    // TODO Remove socket from room.teams if becomes undefined! Remove team if he was only one in there
    // Find room != his id or maybe filter? or findAll?
    // What if I leave before game starts? I need to reset ids based on room.length? Also remove from room.teams
    // Check if room.grid exists to know that game already started or not!
    /*
    Object.keys(socket.rooms).forEach((roomID) => {
      const room = io.sockets.adapter.rooms[roomID];

      if (room.length > 1) {
        const winner = getSockets(room).find(s => s.state.id !== socket.state.id);

        io.to(roomID).emit('end', winner.state.id);
        kickSockets(room);

        console.log(`Client ${socket.id} left ${roomID}`);
        console.log(`Match ended in room: ${roomID}. Winner: ${winner.state.id}.`);
      }
    });
    */
  });
});

server.listen(conf.server.port, () => {
  console.log(`Server listening on port ${conf.server.port}`);
});
