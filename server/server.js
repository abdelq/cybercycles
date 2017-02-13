const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = module.exports.io = require('socket.io')(server);

const game = require('./game');
const config = require('./config');

io.on('connection', (socket) => {
  socket.on('join', (roomID, teamID) => {
    roomID = String(roomID) || 'null';
    socket.join(roomID);

    let room = io.sockets.adapter.rooms[roomID];
    let teams = room.teams || (room.teams = {});

    if(!room.nbPlayers)
      room.nbPlayers = 0;

    // Match already started or Web player
    if (room.grid || teamID === undefined) {
      console.log(`Spectator ${socket.id} joined ${roomID}`);
      return;
    }

    let playerID = String(++room.nbPlayers);
    teamID = String(teamID) || playerID;

    // Team and Player managment
    let team = teams[teamID];

    if(!team && Object.keys(teams).length < config.teams.amount) {
      team = (teams[teamID] = []);
    }
    
    if (team && team.length < config.teams.size) {
      socket.player = {
        id: playerID,
        team: teamID,
        x: 0,
        y: 0,
        direction: '',
      };

      team.push(socket.player);
    }

    if (socket.player) {
      console.log(`Player ${socket.id} (ID: ${socket.player.id}, Team: ${socket.player.team}) joined ${roomID}`);
    } else {
      console.log(`Spectator ${socket.id} joined ${roomID}`);
    }

    // Starts the game
    const fullTeams = Object.keys(teams).filter(
      id => teams[id].length >= config.teams.size
    );

    if (fullTeams.length >= config.teams.amount) {
      game.start(room);
      setTimeout(() => game.step(room), config.delay.initial);

      console.log(`Game started in room ${roomID}`);
    }
  });

  socket.on('move', (direction) => {
    if ('uldr'.indexOf(direction) !== -1) {
      socket.player.direction = direction;
    }
  });

  socket.on('disconnecting', () => {
    let roomID = Object.keys(socket.rooms).find(id => id !== socket.id);
    let room = io.sockets.adapter.rooms[roomID];

    if (!room) {
      return;
    }

    if (socket.player) {
      console.log(`Player ${socket.id} (ID: ${socket.player.id}, Team: ${socket.player.team}) left ${roomID}`);

      if (room.grid) { // Match already started
        game.killPlayer(socket.player, room);

        const aliveTeams = game.getTeams(room, true);

        if (aliveTeams.length < 2) {
          const aliveTeamID = aliveTeams[0][0].team;

          game.endMatch(room, aliveTeamID);
          console.info(`Match ended in room: ${roomID}. Winners: ${aliveTeamID}.`);
        }
      } else { // Match not yet started
        let team = room.teams[socket.player.team];

        // Removes the player from the team
        team.splice(team.indexOf(socket.player), 1);

        // Deletes the team if empty
        if (team.length === 0) {
          delete room.teams[socket.player.team];
        }
      }
    } else {
      console.log(`Spectator ${socket.id} left ${roomID}`);
    }
  });
});

/* Web */
app.use('/public', express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/:room', (req, res) => {
  res.sendFile(__dirname + '/room.html');
});

/* Sockets */
server.listen(config.server.port, () => {
  console.log(`Server listening on port ${config.server.port}`);
});
