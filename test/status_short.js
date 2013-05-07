var optimus = require('../');

if (optimus.isMaster) {
  throw new Error('status_short cannot be run as master');
}

var rand = Math.floor(Math.random() * 2 * 1000); // up to two seconds

setTimeout(function() {
  console.log('loaded status_short in ' + rand + 'ms');
  optimus.ready();
}, rand);
