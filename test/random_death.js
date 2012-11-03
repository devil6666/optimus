var rand = Math.floor(Math.random() * 3 * 1000); // up to three seconds

console.log('dying in ' + rand + 'ms');
setTimeout(function() {
  process.exit(1);
}, rand);
