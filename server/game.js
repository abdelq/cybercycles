const fs = require('fs');

const io = require('./server').io;
const config = require('./config');

/**
 * Gets the room's ID from the room.
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
 * @return {string} Grid representation
 */
function dumpGrid(grid) {
  const line = `\n—${grid[0].map(() => '—').join('')}—\n`;

  return line + grid.map(y => `|${y.join('')}|`).join('\n') + line;
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
      let x;
      let y;

      do {
        x = randInt(tArea * tIndex, tArea * (tIndex + 1));
        y = randInt(pArea * pIndex, pArea * (pIndex + 1));
      } while (room.grid[y][x] !== ' ' ||
        (room.grid[y][x - 1] !== ' ' ||
          room.grid[y][x + 1] !== ' ' ||
          room.grid[y - 1][x] !== ' ' ||
          room.grid[y + 1][x] !== ' '));

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
  io.to(roomID).emit('draw', room.grid, players);

  // Save for playback
  const header = `${players.map(player =>
    `${player.id}: team ${player.team}`
  ).join('\n')}\n\n`;

  room.saveFile = `saves/${roomID}-${Date.now()}.txt`;

  fs.mkdir('saves', (err) => {
    if (err && err.code !== 'EEXIST') {
      console.error(err);
    }
  });

  fs.appendFile(room.saveFile, header, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

/**
 * Updates the game's state.
 *
 * @param {object} room Room
 */
function next(room) {
  // Abort if less than 2 teams left
  if (getTeams(room, true).length < 2) {
    return;
  }

  const players = room.players;
  const alivePlayers = players.filter(player => !player.dead);

  // Position
  alivePlayers.forEach((player) => {
    switch (player.direction) {
      case 'u':
        player.y -= 1;
        break;
      case 'l':
        player.x -= 1;
        break;
      case 'd':
        player.y += 1;
        break;
      case 'r':
        player.x += 1;
        break;
      default:
        break;
    }
  });

  // Collisions
  alivePlayers.forEach((aPlayer) => {
    const cPlayers = players.filter(player =>
      player.x === aPlayer.x && player.y === aPlayer.y
    );

    if (cPlayers > 1 || !room.grid[aPlayer.y] || room.grid[aPlayer.y][aPlayer.x] !== ' ') {
      killPlayer(aPlayer, room);
    } else {
      setGrid(room.grid, aPlayer.x, aPlayer.y, aPlayer.id);
    }
  });

  // Emit infos
  const roomID = getRoomID(room);

  const directions = players.map(p => ({
    id: p.id,
    direction: p.direction,
  }));

  io.to(roomID).emit('next', directions);
  io.to(roomID).emit('draw', room.grid, players);

  // Save for playback
  fs.appendFile(room.saveFile, `${dumpGrid(room.grid)}\n`, (err) => {
    if (err) {
      console.error(err);
    }
  });

  // Death Management
  const aliveTeams = getTeams(room, true);

  if (aliveTeams.length > 1) {
    setTimeout(() => next(room), config.delay.default);
  } else if (aliveTeams.length === 1) {
    const aliveTeamID = aliveTeams[0][0].team;

    endMatch(room, aliveTeamID);
    console.log(`Match ended in room: ${roomID}. Winners: ${aliveTeamID}.`);
  } else {
    endMatch(room);
    console.log(`Match ended in room: ${roomID}. Tie.`);
  }
}

module.exports = {
  start,
  next,
  killPlayer,
  getTeams,
  endMatch,
};
