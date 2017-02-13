var socket = io();
var room = location.pathname.slice(1);
var ctx = canvas.getContext("2d");

document.title = "CyberCycles - " + room;

// Canvas dimensions
canvas.width = parent.innerWidth;
canvas.height = parent.innerHeight * 0.92;

// Cell dimensions
var cellHeight;
var cellWidth;

function drawGrid(grid) {
  ctx.strokeStyle = ctx.fillStyle = 'rgba(24, 202, 230, .75)';
  ctx.shadowColor = 'rgba(21, 171, 195, 0.5)';
  ctx.shadowBlur = 1;

  // Horizontal lines
  for (var i = 0; i <= grid.length; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, cellHeight * i);
    ctx.lineTo(canvas.width, cellHeight * i);
    ctx.closePath();

    ctx.stroke();
  }

  // Vertical lines
  for (var i = 0; i <= grid[0].length; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cellWidth * i, 0);
    ctx.lineTo(cellWidth * i, canvas.height);
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

const teamColors = ['#F00', '#00F', '#0F0', '#FF0', '#F0F', '#0FF'];

function drawPlayers(grid, teams) {
  for (var i = 0; i < grid.length; i += 1) {
    for (var j = 0; j < grid[0].length; j += 1) {
      if (grid[i][j] === 'X') {
        ctx.fillStyle = 'gray';

        ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
      } else if (grid[i][j] !== ' ' && grid[i][j] !== '#') {
        const playerID = +grid[i][j];
        let playerIndex, team;
        
        Object.keys(teams).forEach((id) => {
          let index = teams[id].indexOf(String(playerID));
          if(index !== -1) {
            team = id;
            playerIndex = index;
          }
        });

        let teamIndex = Object.keys(teams).indexOf(team);
          
        const color = teamColors[teamIndex % teamColors.length];

        ctx.fillStyle = color;
        ctx.globalAlpha = 1 - (0.3 * playerIndex);
          
        ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
        ctx.globalAlpha = 1;
      }
    }
  }
}

socket.on('connect', function() {
  socket.emit('join', room);
});

socket.on('draw', function(prevGrid, players) {
  const teams = {};
  players.forEach((p) => {
    if(!teams[p.team])
      teams[p.team] = [p.id];
    else
      teams[p.team].push(p.id);
  });
  
  const teamNames = Object.keys(teams);
  let html = "| ";

  teamNames.forEach((name, idx) => {
    html += '<span style="color: ' + teamColors[idx % teamColors.length] + '">' + name + '</span> | ';
  });

  document.getElementById('header').innerHTML = html;
  
  // Initialize
  if (!cellHeight || !cellWidth) {
    cellHeight = canvas.height / prevGrid.length;
    cellWidth = canvas.width / prevGrid[0].length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid(prevGrid);
    drawObstacles(prevGrid);
  }

  // Update
  drawPlayers(prevGrid, teams);
});

socket.on('end', function(winnerID) {
  cellHeight = cellWidth = null;
  socket.emit('join', room);
});

socket.on('disconnect', function() {
  cellHeight = cellWidth = null;
  socket.emit('join', room);
});
