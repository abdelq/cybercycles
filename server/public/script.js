var socket = io();
var room = window.location.pathname.slice(1);
var ctx = canvas.getContext("2d");

document.title = "CyberCycles - " + room;

// Canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.ready = false;

socket.on('connect', function() {
  socket.emit('join', room);
});

socket.on('start', function(config) {
  console.log(config);
});

socket.on('next', function(prevMoves, grid) {
  var cellHeight = canvas.height / grid.length;
  var cellWidth = canvas.width / grid[0].length;

  if (!canvas.ready) {
    ctx.strokeStyle = 'blue';
    ctx.fillStyle = 'blue';
    //ctx.lineWidth = 1;
    //ctx.lineJoin = 'miter';

    // Grid
    for (var i = 0; i <= grid.length; i += 1) {
      ctx.moveTo(0, cellHeight * i);
      ctx.lineTo(canvas.width, cellHeight * i);
      ctx.stroke();
    }

    for (var i = 0; i <= grid[0].length; i += 1) {
      ctx.moveTo(cellWidth * i, 0);
      ctx.lineTo(cellWidth * i, canvas.height);
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

    canvas.ready = true;
  }

  for (var i = 0; i < grid.length; i += 1) {
    for (var j = 0; j < grid[0].length; j += 1) {
      if (grid[i][j] !== ' ' && grid[i][j] !== '#') {
        ctx.fillStyle = 'red';

        ctx.fillRect(cellWidth * j, cellHeight * i, cellWidth, cellHeight);
      }
    }
  }
});

socket.on('end', function(winnerID) {
  console.log(winnerID);
});

socket.on('disconnect', function() {});
