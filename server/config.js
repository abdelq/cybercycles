const server = {
  port: 1337,
  homepage: 'http://hackathon.iro.umontreal.ca',
};

const delays = {
  init: 400,
  default: 200,
};

const grid = {
  w: { min: 30, max: 40 },
  h: { min: 20, max: 30 },
};

const obstacles = {
  amount: { min: 2, max: 6 },
  w: { min: 2, max: 6 },
  h: { min: 2, max: 6 },
  symetrical: true,
};

const players = {
  // teams: false,
};

module.exports = {
  server: server,
  delays: delays,
  grid: grid,
  obstacles: obstacles,
  players: players,
};
