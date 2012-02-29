"use strict";

var cluster = require('cluster')
  , os = require('os')
  , undeadCount = 0
  , children;

exports.start = function(workers, basedir) {
  if (cluster.isMaster) {
    runMaster(workers, basedir);
  } else {
    runWorker();
  }
};

var runMaster = function(workers, basedir) {
  var cpus = os.cpus().length
    , count
    , autoRestart;
  children = [];
  for (var app in workers) {
    if (workers.hasOwnProperty(app)) {
      // get the number of workers to spwan
      if (typeof workers[app] === "object") {
        eval("count = " + workers[app]["count"]);
        autoRestart = workers[app]["autoRestart"];
      } else {
        eval("count = " + workers[app]);
        autoRestart = true;
      }
      console.log("Spawning " + count + " " + app + " workers.");
      // launch them
      for (var i = 0; i < count; i++) {
        spawnWorker(basedir + "/" + app, autoRestart);
      }
    }
  }
  process.addListener('SIGTERM', function() {
    for (var i = 0; i < children.length; ++i) {
      children[i].kill();
    }
  });
};

var runWorker = function() {
  // workers wait to hear from the server to know what to do
  process.once("message", function(app) {
    // start the app
    var app = require(app);
  });
};

var spawnWorker = function(app, autoRestart) {
  // autoRestart defaults to true
  autoRestart = (typeof autoRestart === "boolean" ? autoRestart : true);
  var worker = cluster.fork()
    , index;
  // tell the worker what to do
  worker.send(app);
  console.log("worker started with pid " + worker.pid);
  ++undeadCount;
  index = children.length;
  children.push(worker);
  worker.on('exit', function(code, signal) {
    if (signal) {
      console.log(app + " worker " + worker.pid + " died with signal " + signal + ".");
    } else if (code) {
      console.log(app + " worker " + worker.pid + " died with code " + code + ".");
    } else {
      console.log(app + " worker " + worker.pid + " died.");
    }
    --undeadCount;
    if (undeadCount == 0) {
      console.log("No workers remaining, commiting suicide.");
      process.exit();
    }
    children.splice(index, 1);
  });
  if (autoRestart) {
    undeadCount = Infinity;
    // auto restart workers on death
    worker.on('exit', function(code, signal) {
      console.log("Starting another " + app + " worker.");
      spawnWorker(app, autoRestart);
    });
  }
};

