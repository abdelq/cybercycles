var socket = io();
var room = location.pathname.slice(1);
var ctx = canvas.getContext('2d');

document.title = `CyberCycles - ${room}`;

// Canvas dimensions
canvas.width = canvas.height = Math.min(parent.innerWidth, parent.innerHeight);

// Cell dimensions
var cellHeight;
var cellWidth;

var teams = {};
var teamColors = ['#f00', '#00f', '#0f0', '#ff0', '#f0f', '#0ff'];

function drawGrid(grid) {
  ctx.strokeStyle = ctx.fillStyle = 'rgba(24, 202, 230, 0.75)';
  ctx.shadowColor = 'rgba(21, 171, 195, 0.5)';
  ctx.shadowBlur = 1;

  // Horizontal lines
  for (var i = 0; i <= grid.length; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, cellHeight * i);
    ctx.lineTo(cellHeight * grid[0].length, cellHeight * i);
    ctx.closePath();

    ctx.stroke();
  }

  // Vertical lines
  for (var j = 0; j <= grid[0].length; j += 1) {
    ctx.beginPath();
    ctx.moveTo(cellWidth * i, 0);
    ctx.lineTo(cellWidth * i, cellWidth * grid.length);
    ctx.closePath();

    ctx.stroke();
  }
}

function drawObstacles(grid) {
  ctx.strokeStyle = ctx.fillStyle = 'rgba(21, 171, 195, 1.0)';

  for (var i = 0; i < grid.length; i += 1) {
    for (var j = 0; j < grid[0].length; j += 1) {
      if (grid[i][j] === '#') {
        ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
      }
    }
  }
}

function drawPlayers(grid, teams) {
  for (var i = 0; i < grid.length; i += 1) {
    for (var j = 0; j < grid[0].length; j += 1) {
      if (grid[i][j] === 'X') {
        ctx.fillStyle = 'gray';

        ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
      } else if (grid[i][j] !== ' ' && grid[i][j] !== '#') {
        var playerID = +grid[i][j];
        var playerIndex,
          team;

        Object.keys(teams).forEach((id) => {
          var index = teams[id].indexOf(String(playerID));

          if (index !== -1) {
            team = id;
            playerIndex = index;
          }
        });

        var teamIndex = Object.keys(teams).indexOf(team);

        var color = teamColors[teamIndex % teamColors.length];

        ctx.fillStyle = color;
        ctx.globalAlpha = 1 - (0.3 * playerIndex);

        ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
        ctx.globalAlpha = 1;
      }
    }
  }
}

socket.on('connect', () => {
  socket.emit('join', room);
});

socket.on('draw', (prevGrid, players) => {
  // Initialize
  if (!cellHeight || !cellWidth) {
    cellWidth = cellHeight = Math.min(canvas.height / prevGrid.length, canvas.width / prevGrid[0].length);

    players.forEach((p) => {
      if (teams[p.team])  {
        teams[p.team].push(p.id);
      } else {
        teams[p.team] = [p.id];
      }
    });

    // Header
    var html = ' | ';

    Object.keys(teams).forEach((name, idx) => {
      html += `<span style="color: ${teamColors[idx % teamColors.length]}">${name}</span> | `;
    });

    document.getElementById('header').innerHTML = html;

    // Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(prevGrid);
    drawObstacles(prevGrid);
  }

  // Update
  drawPlayers(prevGrid, teams);
});

socket.on('end', (winnerID) => {
  cellHeight = cellWidth = null;
  socket.emit('join', room);
});

socket.on('disconnect', () => {
  cellHeight = cellWidth = null;
  socket.emit('join', room);
});

// Refresh on resize
window.addEventListener('resize', function () { 
  window.location.reload(); 
});
