var rand = Math.floor(Math.random() * 2 * 1000); // up to two seconds

setTimeout(function() {
  console.log('loaded status_short in ' + rand + 'ms');
  process.send({status: 'ready'})
}, rand);
