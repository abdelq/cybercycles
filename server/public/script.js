var socket = io();
var room = location.pathname.slice(1);
var ctx = canvas.getContext("2d");

document.title = "CyberCycles - " + room;

// Canvas dimensions
canvas.width = parent.innerWidth;
canvas.height = parent.innerHeight;

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

function drawPlayers(grid) {
  for (var i = 0; i < grid.length; i += 1) {
    for (var j = 0; j < grid[0].length; j += 1) {
      if (grid[i][j] === 'X') {
        ctx.fillStyle = 'gray';

        ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
      } else if (grid[i][j] !== ' ' && grid[i][j] !== '#') {
        if (grid[i][j] % 2 === 0) {
          ctx.fillStyle = 'rgba(' + Math.round(255 - 21.25 * grid[i][j]) + ', 0, 0, 1.0)';
        } else {
          ctx.fillStyle = 'rgba(0, 0, ' + Math.round(255 - 21.25 * grid[i][j]) + ', 1.0)';
        }

        ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
      }
    }
  }
}

socket.on('connect', function() {
  socket.emit('join', room);
});

socket.on('next', function(prevMoves, prevGrid) {
  // Initialize
  if (!cellHeight || !cellWidth) {
    cellHeight = canvas.height / prevGrid.length;
    cellWidth = canvas.width / prevGrid[0].length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid(prevGrid);
    drawObstacles(prevGrid);
  }

  // Update
  drawPlayers(prevGrid);
});

socket.on('end', function(winnerID) {
  cellHeight = cellWidth = null;
  socket.emit('join', room);
});

socket.on('disconnect', function() {
  cellHeight = cellWidth = null;
  socket.emit('join', room);
});
