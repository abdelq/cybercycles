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
  return getSockets(room).map(socket => socket.state)
                         .filter(player => player.team);
}

function getAliveTeams(room) {
  return Object.keys(room.teams).map(id =>
    room.teams[id]
  ).filter(team =>
    team.find(socket => !socket.state.dead)
  );
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
  const teams = Object.keys(room.teams).map(id => room.teams[id]);

  teams.forEach((team, tIndex) => {
    const tArea = Math.floor(grid.w / conf.teams.amount);

    team.forEach((socket, pIndex) => {
      const pArea = Math.floor(grid.h / conf.teams.size);

      // TODO Add back testMode if possible
      // Possible infinite loop
      // TODO Find a sexier solution if possible
      let x; let y;
      do {
        x = randomInt(tIndex * tArea, (tIndex + 1) * tArea);
        y = randomInt(pIndex * pArea, (pIndex + 1) * pArea);
      } while (room.grid[y][x] !== 0);

      socket.state.x = x;
      socket.state.y = y;

      x >= (grid.h / 2) ? socket.state.direction = 'u' : socket.state.direction = 'd';
    });
  });

  return getPlayers(room);
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
  const aliveTeams = getAliveTeams(room);

  // Stop if less than 2 teams are alive
  if (aliveTeams.length < 2) {
    return;
  }

  const players = getPlayers(room);

  // Position update
  players.forEach((p) => {
    switch (p.direction) {
      case 'u': p.y -= 1; break;
      case 'l': p.x -= 1; break;
      case 'd': p.y += 1; break;
      case 'r': p.x += 1; break;
      default: break;
    }
  });

  // Collisions
  // TODO Find players with same position
  /*
  if (something) {
    // Between 2 players
    setGrid(room.grid, players[0].x, players[0].y, -2);
    players[0].dead = true;
    players[1].dead = true;
  }
  */

  players.forEach((player) => {
    /*
    if (isEmpty(room.grid, player.x, player.y)) {
      setGrid(room.grid, player.x, player.y, player.id);
    } else {
      setGrid(room.grid, player.x, player.y, -2);
      
      player.dead = true;
    }
    */
  });

  const roomID = getRoomID(room);

  // Sending player moves
  const directions = players.map(p =>
     ({
       id: p.id,
       direction: p.direction,
     })
  );

  io.to(roomID).emit('nextMove', directions);

  // Death Management
  aliveTeams = getAliveTeams(room);

  if (aliveTeams.length > 1) {
    setTimeout(() => step(room), conf.delays.default);
  } else if (aliveTeams.length === 1) {
    let teamID = aliveTeams[0][0].state.team;

    io.to(roomID).emit('end', teamID);
    kickSockets(room);

    console.log(`Match ended in room: ${roomID}. Winners: ${teamID}.`);
  } else if (aliveTeams.length === 0) {
    io.to(roomID).emit('end', false);
    kickSockets(room);

    console.log(`Match ended in room: ${roomID}. Tie.`);
  }
}

io.on('connection', (socket) => {
  socket.on('join', (roomID, teamID) => {
    socket.join(roomID);

    const room = io.sockets.adapter.rooms[roomID];
    const lastID = room.lastID ? room.lastID += 1 : room.lastID = 1;
    const teams = room.teams ? room.teams : room.teams = {};

    // Team Management
    if (Object.keys(teams).length < conf.teams.amount) {
      if (!teamID) {
        teamID = lastID;
      }

      const team = teams[teamID];
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
      direction: '',
    };

    console.log(`Client ${socket.id} (id: ${socket.state.id}, team: ${socket.state.team}) joined ${roomID}`);

    // Starts the game if all teams are full
    if (!room.grid) {
      const fullTeams = Object.keys(teams).filter(id =>
       teams[id].length === conf.teams.size
      );

      if (fullTeams.length === conf.teams.amount) {
        start(room);
        setTimeout(() => step(room), conf.delays.init);
      }
    }
  });

  socket.on('move', (direction) => {
    const player = socket.state;

    if ('uldr'.indexOf(direction) !== -1) {
      player.direction = direction;
    }
  });

  socket.on('disconnecting', () => {
    const roomID = Object.keys(socket.rooms).find(id => id !== socket.id);
    const room = io.sockets.adapter.rooms[roomID];

    if (socket.state.team && room) {
      const team = room.teams[socket.state.team];

      console.log(`Client ${socket.id} (id: ${socket.state.id}, team: ${socket.state.team}) left ${roomID}`);

      if (!room.grid) { // Match not started
        team.splice(team.indexOf(socket), 1); // Removes the player from his team

        if (team.length === 0) {
          delete room.teams[socket.state.team]; // Deletes the team if empty
        }
      } else { // Match started
        socket.state.dead = true;

        const aliveTeams = getAliveTeams(room);

        if (aliveTeams.length === 1) {
          let teamID = aliveTeams[0][0].state.team;

          io.to(roomID).emit('end', teamID);
          kickSockets(room);

          console.log(`Match ended in room: ${roomID}. Winners: ${teamID}.`);
        }
      }
    }
  });
});

server.listen(conf.server.port, () => {
  console.log(`Server listening on port ${conf.server.port}`);
});
