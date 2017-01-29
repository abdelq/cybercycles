const io = require('./server');
const config = require('./config');

function getSockets(room) {
  return Object.keys(room.sockets).map(id => io.sockets.connected[id]);
}

function getRoomID(room) {
  const rooms = io.sockets.adapter.rooms;
  return Object.keys(rooms).find(id => rooms[id] === room);
}

function getTeams(room, alive) {
  const teams = Object.keys(room.teams).map(id => room.teams[id]);

  if (alive) {
    return teams.filter(team =>
      team.find(player => !player.dead)
    );
  }

  return teams;
}

function endMatch(room, teamID) {
  const roomID = getRoomID(room);

  io.to(roomID).emit('end', teamID);
  getSockets(room).forEach(socket => socket.leave(roomID));
}

function killPlayer(player, room) {
  player.dead = true;
  setGrid(room.grid, player.x, player.y, 'X');
}

function setGrid(grid, x, y, val) {
  if (y >= 0 && x >= 0 && y < grid.length && x < grid[y].length) {
    grid[y][x] = val;
  }
}

function randInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setObstacles(grid, amount) {
  const obstacles = [];

  for (let i = 0; i < amount; i += 1) {
    const ob = {
      x: randInt(0, grid[0].length),
      y: randInt(0, grid.length),
      w: randInt(config.ob.width.min, config.ob.width.max),
      h: randInt(config.ob.height.min, config.ob.height.max),
    };

    obstacles.push(ob);

    if (config.ob.symetrical) {
      const x = grid[0].length - ob.w - ob.x;
      const y = grid.length - ob.h - ob.y;

      const obSym = {
        x,
        y,
        w: ob.w,
        h: ob.h,
      };

      obstacles.push(obSym);

      i += 1;
    }
  }

  return obstacles;
}

function setPlayers(room) {
  const players = [];

  // Spawning surfaces
  const tArea = Math.floor(room.grid[0].length / config.teams.amount);
  const pArea = Math.floor(room.grid.length / config.teams.size);

  getTeams(room).forEach((team, tIndex) => {
    team.forEach((player, pIndex) => {
      let x; let y;

      do {
        x = randInt(tArea * tIndex, tArea * (tIndex + 1));
        y = randInt(pArea * pIndex, pArea * (pIndex + 1));
      } while (room.grid[y] && room.grid[y][x] !== ' ');

      // Position
      player.x = x;
      player.y = y;

      // Direction
      if (x > (room.grid[0].length / 2)) {
        player.direction = 'l';
      } else {
        player.direction = 'r';
      }

      players.push(player);
    });
  });

  return players;
}

function start(room) {
  // Grid
  const width = randInt(config.grid.width.min, config.grid.width.max);
  const height = randInt(config.grid.height.min, config.grid.height.max);

  room.grid = Array(height).fill().map(() => Array(width).fill(' '));

  // Obstacles
  const amount = randInt(config.ob.amount.min, config.ob.amount.max);
  const obstacles = setObstacles(room.grid, amount);

  obstacles.forEach((ob) => {
    for (let x = (ob.x + ob.w) - 1; x >= ob.x; x -= 1) {
      for (let y = (ob.y + ob.h) - 1; y >= ob.y; y -= 1) {
        setGrid(room.grid, x, y, '#');
      }
    }
  });

  // Players
  const players = setPlayers(room);
  
  players.forEach((player) => {
    setGrid(room.grid, player.x, player.y, player.id);
  });

  // Emit infos
  const roomID = getRoomID(room);

  getSockets(room).forEach((socket) => {
    if (socket.player) {
      socket.emit('start', {
        players,
        obstacles,
        w: width,
        h: height,
        me: socket.player.id,
      });
    }
  });

  io.to(roomID).emit('next', []);
}

function step(room) {
  // Abort if less than 2 teams left
  if (getTeams(room, true).length < 2) {
    return;
  }

  const players = getSockets(room).filter(socket => socket.player)
                                  .map(socket => socket.player);

  // Position
  players.forEach((p) => {
    switch (p.direction) {
      case 'u': p.y -= 1; break;
      case 'l': p.x -= 1; break;
      case 'd': p.y += 1; break;
      case 'r': p.x += 1; break;
    }
  });

  // Collisions
  players.forEach((player) => {
    const cPlayers = players.slice().filter(
      p => p.x === player.x && p.y === player.y
    );

    if (cPlayers > 1 || (room.grid[player.y] && room.grid[player.y][player.x] !== ' ')) {
      killPlayer(player, room);
    } else {
      setGrid(room.grid, player.x, player.y, player.id);
    }
  });

  dumpGrid(room.grid);

  // Emit infos
  const roomID = getRoomID(room);

  const directions = players.map((p) => ({
    id: p.id,
    direction: p.direction,
  }));

  io.to(roomID).emit('next', directions);

  // Death Management
  const aliveTeams = getTeams(room, true);

  if (aliveTeams.length > 1) {
    setTimeout(() => step(room), config.delay.default);
  } else if (aliveTeams.length === 1) {
    const aliveTeamID = aliveTeams[0][0].team;

    endMatch(room, aliveTeamID);
    console.info(`Match ended in room: ${roomID}. Winners: ${aliveTeamID}.`);
  } else {
    endMatch(room, false);
    console.info(`Match ended in room: ${roomID}. Tie.`);
  }
}

module.exports = {
  start,
  step,
  killPlayer,
  getTeams,
  endMatch
};
