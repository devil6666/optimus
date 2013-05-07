var optimus = require('../index')

optimus.on('ready', function(app) {
  console.log('optimus::' + app + ':ready');
});

optimus.on('all ready', function() {
  console.log('optimius:::ready');
});

optimus.start({
  status_short: 'cpus',
  status_long: 'cpus',
}, __dirname);
