const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const config = require('./config');

io.on('connection', (socket) => {
  socket.on('join', (roomID, teamID) => {
    // roomID = String(roomID) || 'null';
    socket.join(roomID);

    let room = io.sockets.adapter.rooms[roomID];
    let teams = room.teams || (room.teams = {});

    // Match already started
    if (room.grid) {
      return;
    }

    let playerID = Object.keys(teams).length + 1;
    teamID = String(teamID) || String(playerID);

    // Team and Player managment
    if (Object.keys(teams).length < config.teams.amount) {
      let team = teams[teamID] || (teams[teamID] = []);

      if (team.length < config.teams.size) {
        team.push(socket);

        socket.player = {
          id: playerID,
          team: teamID,
          x: 0,
          y: 0,
          direction: '',
        };
      }
    }

    if (socket.player) {
      console.log(`Player ${socket.id} (ID: ${socket.player.id}, Team: ${socket.player.team}) joined ${roomID}`);
    } else {
      console.log(`Spectator ${socket.id} joined ${roomID}`);
    }

    // Starts the game
    const fullTeams = Object.keys(teams).filter(id =>
      teams[id].length === config.teams.size
    );

    if (fullTeams.length === config.teams.amount) {
      // start(room);
      // setTimeout(() => step(room), config.delay.initial);
      console.log(`Game started in room ${roomID}`);
    }
  });

  socket.on('move', (direction) => {
    if ('uldr'.indexOf(direction) !== -1) {
      // if socket.player?
      socket.player.direction = direction;
    }
  });

  socket.on('disconnecting', () => {
    //let roomID = Object.keys(socket.rooms).find(id => id !== socket.id); // TODO Update this
    let room = io.sockets.adapter.rooms[roomID];

    if (socket.player) {
      if (room.grid) { // Match already started
      } else { // Match not yet started
      }

      console.log(`Player ${socket.id} (ID: ${socket.player.id}, Team: ${socket.player.team}) left ${roomID}`);
    } else {
      console.log(`Spectator ${socket.id} left ${roomID}`);
    }
  });
});

/* Web */
app.use(express.static('public'));

app.get('/', (req, res) => res.redirect(config.server.homepage));

app.get('/:room', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

/* Sockets */
server.listen(config.server.port, () => {
  console.log(`Server listening on port ${config.server.port}`);
});
