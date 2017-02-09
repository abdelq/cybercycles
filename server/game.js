const io = require('./server').io;
const config = require('./config');

/**
 * Returns the room ID of a room
 *
 * @param {object} room Room
 * @return {string} Room ID
 */
function getRoomID(room) {
  const rooms = io.sockets.adapter.rooms;
  return Object.keys(rooms).find(id => rooms[id] === room);
}

/**
 * Generates a pseudorandom integer, between two values.
 *
 * @param {number} min Minimal value
 * @param {number} max Maximal value
 * @return {number} Generated integer
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Converts a grid to its string representation.
 *
 * @param {object} grid Grid
 * @return {string} Grid
 */
function dumpGrid(grid) {
  return grid.map(y => '|' + y.join('') + '|').join('\n') +
    '\n—' + grid[0].map(x => '—').join('') + '—';
}

/**
 * Lists the sockets present in a room
 *
 * @param {object} room Room
 * @return {object} List of sockets
 */
function getSockets(room) {
  return Object.keys(room.sockets).map(id => io.sockets.connected[id]);
}

/**
 * Lists all of the teams in a room, or only the ones alive or dead.
 *
 * @param {object} room Room
 * @param {boolean} alive Alive or not (optional)
 * @return {object} List of teams
 */
function getTeams(room, alive) {
  const teams = Object.keys(room.teams).map(id => room.teams[id]);

  if (alive === true) {
    return teams.filter(team =>
      team.find(player => !player.dead)
    );
  } else if (alive === false) {
    return teams.filter(team =>
      team.find(player => player.dead)
    );
  }

  return teams;
}

/**
 * Marks a player as dead.
 *
 * @param {object} player Player
 * @param {object} room Room
 */
function killPlayer(player, room) {
  player.dead = true;
  setGrid(room.grid, player.x, player.y, 'X');
}

/**
 * Declares the match as ended, kicking all sockets from the room.
 *
 * @param {object} room Room
 * @param {string} teamID Team ID of the winner team
 */
function endMatch(room, teamID) {
  const roomID = getRoomID(room);

  io.to(roomID).emit('end', teamID);
  getSockets(room).forEach(socket => socket.leave(roomID));
}

/**
 * Sets a value in a grid's cell.
 *
 * @param {object} grid Grid
 * @param {number} x Position in the X axis
 * @param {number} y Position in the Y axis
 * @param {string} val Value to set
 */
function setGrid(grid, x, y, val) {
  if (y >= 0 && x >= 0 && y < grid.length && x < grid[y].length) {
    grid[y][x] = val;
  }
}

/**
 * Sets and returns a list of the generated obstacles' coordinates.
 *
 * @param {object} grid Grid
 * @param {number} amount Amount of obstacles
 * @return {object} List of obstacle coordinates
 */
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

/**
 * Sets the position and direction of players in a grid.
 *
 * @param {object} room Room
 * @return {object} List of players
 */
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
      } while (room.grid[y][x] !== ' ');

      // Position
      player.x = x;
      player.y = y;

      // Direction
      if (y > (room.grid.length / 2)) {
        player.direction = 'u';
      } else {
        player.direction = 'd';
      }

      players.push(player);
    });
  });

  return players;
}

/**
 * Starts the game.
 *
 * @param {object} room Room
 */
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

/**
 * Updates the game's state.
 *
 * @param {object} room Room
 */
function step(room) {
  // Abort if less than 2 teams left
  if (getTeams(room, true).length < 2) {
    return;
  }

  const players = getSockets(room).map(socket => socket.player)
                                  .filter(player => player);

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

    if (cPlayers > 1 || !room.grid[player.y] || room.grid[player.y][player.x] !== ' ') {
      killPlayer(player, room);
    } else {
      setGrid(room.grid, player.x, player.y, player.id);
    }
  });

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
  } else if (aliveTeams.length < 2) {
    const aliveTeamID = aliveTeams[0][0].team;

    endMatch(room, aliveTeamID);
    console.info(`Match ended in room: ${roomID}. Winners: ${aliveTeamID}.`);
  } else {
    endMatch(room, '');
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
