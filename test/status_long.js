var rand = Math.floor(Math.random() * 5 * 1000); // up to five seconds

setTimeout(function() {
  console.log('loaded status_long in ' + rand + 'ms');
  require('../').ready();
}, rand);
