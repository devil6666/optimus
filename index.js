"use strict";

var cluster = require('cluster')
  , os = require('os')
  , undeadCount = 0
  , children = [];

exports.restartTimeout = 3000;

exports.start = function(workers, basedir) {
  if (cluster.isMaster) {
    runMaster(workers, basedir);
  } else {
    runWorker();
  }
};

function runMaster(workers, basedir) {

  Object.keys(workers).forEach(function(app) {
    var count
      , autoRestart = true;
    // get the number of workers to spwan
    if (typeof workers[app] === "object") {
      count = getCount(workers[app].count);
      autoRestart = workers[app].autoRestart;
    } else {
      count = getCount(workers[app]);
    }

    console.log("Spawning " + count + " " + app + " workers.");
    // launch them
    for (var i = 0; i < count; i++) {
      spawnWorker(basedir + "/" + app, autoRestart);
    }
  });

  process.addListener('SIGTERM', destroyChildren);
  process.addListener('SIGINT', destroyChildren);
  process.addListener('SIGHUP', destroyChildren);

  function destroyChildren() {
    for (var i = 0; i < children.length; ++i) {
      children[i].destroy();
    }
    process.exit();
  }

};

function runWorker() {
  // workers wait to hear from the server to know what to do
  process.once("message", function(app) {
    // start the app
    var app = require(app);
  });
};

function spawnWorker(app, autoRestart) {
  // autoRestart defaults to true
  autoRestart = (typeof autoRestart === "boolean" ? autoRestart : true);
  var worker = cluster.fork()

  // tell the worker what to do
  worker.send(app);
  console.log("worker started with pid " + worker.process.pid);
  ++undeadCount;
  children.push(worker);

  worker.on('exit', function(code, signal) {
    if (signal) {
      console.log(app + " worker " + worker.process.pid + " died with signal " + signal + ".");
    } else if (code) {
      console.log(app + " worker " + worker.process.pid + " died with code " + code + ".");
    } else {
      console.log(app + " worker " + worker.process.pid + " died.");
    }
    --undeadCount;

    if (undeadCount == 0) {
      console.log("No workers remaining, commiting suicide.");
      process.exit();
    }

    for (var i = 0; i < children.length; ++i) {
      if (children[i] === worker) {
        children.splice(i, 1);
        break;
      }
    }
  });

  if (autoRestart) {
    undeadCount = Infinity;
    // auto restart workers on death
    worker.on('exit', function(code, signal) {
      setTimeout(function() {
        console.log("Starting another " + app + " worker.");
        spawnWorker(app, autoRestart);
      }, exports.restartTimeout);
    });
  }
};

function getCount(n) {
  var cpus = os.cpus().length
  var match;
  if (n === 'cpus') {
    return cpus;
  }
  if (match = n.toString().match(/cpus\s*\*\s*(\d+)/)) {
    return cpus * parseInt(match[1]);
  }
  return parseInt(n);
}

