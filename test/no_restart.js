var optimus = require('../index')

optimus.start({
  random_death: {
    count: "cpus*2",
    autoRestart: false
  }
}, __dirname);
