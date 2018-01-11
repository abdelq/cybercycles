const port = 1337;

const delay = {
  initial: 400,
  default: 200,
};

const grid = {
  width: {
    min: 30,
    max: 40,
  },
  height: {
    min: 30,
    max: 40,
  },
};

const obstacles = {
  amount: {
    min: 2,
    max: 6,
  },
  width: {
    min: 2,
    max: 6,
  },
  height: {
    min: 2,
    max: 6,
  },
  symetrical: true,
};

const teams = {
  amount: 2,
  size: 1,
};

module.exports = {
  port,
  delay,
  grid,
  ob: obstacles,
  teams,
};
