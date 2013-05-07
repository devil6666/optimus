var optimus = require('../');

if (optimus.isMaster) {
  throw new Error('status_short cannot be run as master');
}

var rand = Math.floor(Math.random() * 5 * 1000); // up to five seconds

setTimeout(function() {
  console.log('loaded status_long in ' + rand + 'ms');
  optimus.ready();
}, rand);
