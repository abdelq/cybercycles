var socket = io();

var room = window.location.pathname.slice(1);
document.title = "CyberCycles - " + room;

// Canvas
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.ready = false;

// Grid
var grid;
var cellHeight;
var cellWidth;

socket.on('connect', function() {
  socket.emit('join', room);
});

socket.on('next', function(prevMoves, prevGrid) {
  if (!canvas.ready) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid = prevGrid;

    cellHeight = canvas.height / grid.length;
    cellWidth = canvas.width / grid[0].length;

    ctx.strokeStyle = ctx.fillStyle = 'rgba(24, 202, 230, 1.0)';
    ctx.shadowColor = 'rgba(21, 171, 195, 0.7)';
    ctx.shadowBlur = 1;

    // Grid
    for (var i = 0; i <= grid.length; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, cellHeight * i);
      ctx.lineTo(canvas.width, cellHeight * i);
      ctx.closePath();
      ctx.stroke();
    }

    for (var i = 0; i <= grid[0].length; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cellWidth * i, 0);
      ctx.lineTo(cellWidth * i, canvas.height);
      ctx.closePath();
      ctx.stroke();
    }

    // Obstacles
    for (var i = 0; i < grid.length; i += 1) {
      for (var j = 0; j < grid[0].length; j += 1) {
        if (grid[i][j] === '#') {
          ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
        }
      }
    }

    // Players
    for (var i = 0; i < grid.length; i += 1) {
      for (var j = 0; j < grid[0].length; j += 1) {
        if (grid[i][j] !== ' ' && grid[i][j] !== '#') {
          if (grid[i][j] % 2 === 0) {
            ctx.fillStyle = 'rgba(' + (255 - 25 * grid[i][j]) + ', 0, 0, 1.0)';
          } else {
            ctx.fillStyle = 'rgba(0, 0, ' + (255 - 25 * grid[i][j]) + ', 1.0)';
          }

          ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
        }
      }
    }

    canvas.ready = true;
  }

  for (var i = 0; i < grid.length; i += 1) {
    for (var j = 0; j < grid[0].length; j += 1) {
      if (grid[i][j] !== prevGrid[i][j]) {
        if (prevGrid[i][j] % 2 === 0) {
          ctx.fillStyle = 'rgba(' + (255 - 25 * prevGrid[i][j]) + ', 0, 0, 1.0)';
        } else {
          ctx.fillStyle = 'rgba(0, 0, ' + (255 - 25 * prevGrid[i][j]) + ', 1.0)';
        }

        ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
      }
    }
  }

  grid = prevGrid;
});

socket.on('end', function(winnerID) {
  canvas.ready = false;
  socket.emit('join', room);
});

socket.on('disconnect', function() {
  canvas.ready = false;
  socket.emit('join', room);
});

// TODO should not be coloring those already colored
// TODO Fix style
// TODO b4 game, after game, cleanup reset
