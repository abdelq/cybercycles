const express = require('express');
const http = require('http');
const Server = require('socket.io');
const conf = require('./config');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Optional arguments
const testMode = process.argv.indexOf('--test') !== -1;

// Homepage
app.get('/', (req, res) => res.redirect(conf.server.homepage));

// Web player
app.get('/rooms/:id', (req, res) => {
  const room = io.sockets.adapter.rooms[req.params.id];

  if (room) {
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

function getSockets(room) {
  return Object.keys(room.sockets).map(id => io.sockets.connected[id]);
}

function getPlayers(room) {
  return getSockets(room).map(socket => socket.state)
                         .filter(player => player.team);
}

function getTeams(room, alive) {
  const teams = Object.keys(room.teams).map(id =>
    room.teams[id].map(socket => socket.state)
  );

  if (alive) {
    return teams.filter(team =>
      team.find(player => !player.dead)
    );
  }

  return teams;
}

function getRoomID(room) {
  const rooms = io.sockets.adapter.rooms;
  return Object.keys(rooms).find(id => rooms[id] === room);
}

function getGrid(grid, x, y) {
  if (y >= 0 && x >= 0 && y < grid.length && x < grid[y].length) {
    return grid[y][x];
  }

  return undefined;
}

function dumpGrid(grid) {
    return grid.map(x => '|' + x.join('') + '|')
        .join('\n')
        .replace(/-1/g, '#')
        .replace(/-2/g, 'x')
        .replace(/0/g, ' ')
        + '\n ' + grid[0].map(x => '-').join('');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function kickSockets(room) {
  const roomID = getRoomID(room);
  getSockets(room).forEach(socket => socket.leave(roomID));
}

function setGrid(grid, x, y, val) {
  if (y >= 0 && x >= 0 && y < grid.length && x < grid[y].length) {
    grid[y][x] = val;
  }
}

function setObstacles(amount, grid) {
  const obstacles = [];

  for (let i = 0; i < amount; i += 1) {
    const ob = {
      x: randomInt(0, grid[0].length),
      y: randomInt(0, grid.length),
      w: randomInt(conf.ob.w.min, conf.ob.w.max),
      h: randomInt(conf.ob.h.min, conf.ob.h.max),
    };
    obstacles.push(ob);

    if (conf.ob.symetrical) {
      const x = grid[0].length - ob.w - ob.x;
      const y = grid.length - ob.h - ob.y;

      const obSym = {
        x: x > 0 ? x : 0,
        y: y > 0 ? y : 0,
        w: ob.w,
        h: ob.h,
      };
      obstacles.push(obSym);

      i += 1; // Increments a second time
    }
  }

  // Drawing on grid
  obstacles.forEach((ob) => {
    for (let x = (ob.x + ob.w) - 1; x >= ob.x; x -= 1) {
      for (let y = (ob.y + ob.h) - 1; y >= ob.y; y -= 1) {
        setGrid(grid, x, y, -1);
      }
    }
  });

  return obstacles;
}

function setPlayers(room, grid) {
  const teams = getTeams(room);
  const players = getPlayers(room);

  // Spawning surface for each team/player
  const tArea = Math.floor(grid[0].length / conf.teams.amount);
  const pArea = Math.floor(grid.length / conf.teams.size);

  teams.forEach((team, tIndex) => {
    team.forEach((player, pIndex) => {
      let x; let y;

      do {
        x = randomInt(tArea * tIndex, tArea * (tIndex + 1));
        y = randomInt(pArea * pIndex, pArea * (pIndex + 1));
      } while (room.grid[y][x] !== 0);

      // Position
      player.x = x;
      player.y = y;

      // Direction
      if (x >= (grid.length / 2)) {
        player.direction = 'u';
      } else {
        player.direction = 'd';
      }

      // Drawing on grid
      setGrid(grid, player.x, player.y, player.id);
    });
  });

  return players;
}

function start(room) {
  // Grid
  const width = randomInt(conf.grid.w.min, conf.grid.w.max);
  const height = randomInt(conf.grid.h.min, conf.grid.h.max);

  room.grid = Array(height).fill().map(() => Array(width).fill(0));

  // Obstacles
  const amount = testMode ? 0 : randomInt(conf.ob.amount.min, conf.ob.amount.max);
  const obstacles = setObstacles(amount, room.grid);

  // Players
  const players = setPlayers(room, room.grid);

  // Emit info to clients
  const roomID = getRoomID(room);

  getSockets(room).forEach((socket) => {
    socket.emit('start', {
      players,
      obstacles,
      w: width,
      h: height,
      me: socket.state.id,
    });
  });
  io.to(roomID).emit('nextMove', []);
}

function step(room) {
  // Abort if less than 2 teams left
  if (getTeams(room, true).length < 2) {
    return;
  }

  const players = getPlayers(room);

  // Position
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
  const cPlayers = players.slice();

  cPlayers.forEach((player, index, arr) => {
    const colPlayers = arr.slice(index).filter(p =>
      p.x === player.x && p.y === player.y
    );

    if (colPlayers > 1) {
      // Collision between players
      colPlayers.forEach((p) => {
        p.dead = true;
      });

      setGrid(room.grid, player.x, player.y, -2);
    } else if (getGrid(room.grid, player.x, player.y) !== 0) {
      // Collision between player and obstacle
      player.dead = true;

      setGrid(room.grid, player.x, player.y, -2);
    } else {
      setGrid(room.grid, player.x, player.y, player.id);
    }
  });

  // Emit info to clients
  const roomID = getRoomID(room);

  const directions = players.map(p =>
     ({
       id: p.id,
       direction: p.direction,
     })
  );

  io.to(roomID).emit('nextMove', directions);

  if(testMode) {
      console.log(dumpGrid(room.grid));
  }

  // Death Management
  const aliveTeams = getTeams(room, true);

  if (aliveTeams.length > 1) {
    setTimeout(() => step(room), conf.delays.default);
  } else if (aliveTeams.length === 1) {
    const teamID = aliveTeams[0][0].team;

    io.to(roomID).emit('end', teamID);
    kickSockets(room);

    console.info(`Match ended in room: ${roomID}. Winners: ${teamID}.`);
  } else if (aliveTeams.length === 0) {
    io.to(roomID).emit('end', false);
    kickSockets(room);

    console.info(`Match ended in room: ${roomID}. Tie.`);
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

    console.info(`Client ${socket.id} (id: ${socket.state.id}, team: ${socket.state.team}) joined ${roomID}`);

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
    const player = socket.state;
    const roomID = Object.keys(socket.rooms).find(id => id !== socket.id);
    const room = io.sockets.adapter.rooms[roomID];

    if (room && !player.team) {
      const team = room.teams[player.team];

      console.info(`Client ${socket.id} (id: ${player.id}, team: ${player.team}) left ${roomID}`);

      if (!room.grid) { // Match not started
        team.splice(team.indexOf(socket), 1); // Removes the player from the team

        if (team.length === 0) {
          delete room.teams[player.team]; // Deletes the team if empty
        }
      } else { // Match started
        const aliveTeams = getTeams(room, true);

        player.dead = true;
        setGrid(room.grid, player.x, player.y, -2);

        if (aliveTeams.length === 1) {
          const teamID = aliveTeams[0][0].team;

          io.to(roomID).emit('end', teamID);
          kickSockets(room);

          console.info(`Match ended in room: ${roomID}. Winners: ${teamID}.`);
        }
      }
    }
  });
});

server.listen(conf.server.port, () => {
  console.info(`Server listening on port ${conf.server.port}`);
});
