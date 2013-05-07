"use strict";

var cluster     = require('cluster')
  , events      = require('events')
  , os          = require('os')
  , optimus     = new events.EventEmitter
  , children    = []
  , finished    = []
  , undeadCount = 0
  , workers
  , basedir
  ;

module.exports = optimus;

optimus.restartTimeout = 3000;

optimus.isMaster = cluster.isMaster;

optimus.ready = function() {
  if (process.send) {
    process.send({status: 'ready'});
    return true;
  } else {
    return false;
  }
}

optimus.start = function(_workers, _basedir) {
  workers = _workers;
  basedir = _basedir;
  if (cluster.isMaster) {
    runMaster();
  } else {
    runWorker();
  }
};

function checkStatuses() {
  var apps = {};
  children.forEach(function(child) {
    if (child.status === 'ready') {
      apps[child.app] = !apps[child.app] ? 1 : apps[child.app] + 1 ;
    }
  });
  Object.keys(workers).forEach(function(app) {
    if (finished.indexOf(app) == -1 && getCount(app) === apps[app]) {
      finished.push(app);
      optimus.emit('ready', app);
    }
  });
  if (Object.keys(workers).length == finished.length) {
    optimus.emit('all ready');
  }
}

function runMaster() {

  Object.keys(workers).forEach(function(app) {
    var count = getCount(app)
      , autoRestart = typeof workers[app] === "object" ? workers[app].autoRestart : true
      ;

    console.log("Spawning " + count + " " + app + " workers.");
    // launch them
    for (var i = 0; i < count; i++) {
      spawnWorker(app, autoRestart);
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
  process.on("message", function(msg) {
    // start the app
    if(msg.appPath) require(msg.appPath)
  });
};

function spawnWorker(app, autoRestart) {
  // autoRestart defaults to true
  autoRestart = (typeof autoRestart === "boolean" ? autoRestart : true);
  var worker = cluster.fork()
    , appPath = basedir + '/' + app
    ;

  // keep track of what this worker is
  worker.app = app;

  // tell the worker what to do
  worker.send({appPath: appPath});
  console.log("worker started with pid " + worker.process.pid);
  ++undeadCount;
  children.push(worker);

  worker.on('message', function (msg) {
    if(msg.status) {
      worker.status = msg.status;
      checkStatuses();
    }
  });

  worker.on('exit', function(code, signal) {
    if (signal) {
      console.log(appPath + " worker " + worker.process.pid + " died with signal " + signal + ".");
    } else if (code) {
      console.log(appPath + " worker " + worker.process.pid + " died with code " + code + ".");
    } else {
      console.log(appPath + " worker " + worker.process.pid + " died.");
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
      }, optimus.restartTimeout);
    });
  }
};

function getCount(app) {
  // get the number of workers to spawn
  var n = typeof workers[app] === "object" ? workers[app].count : workers[app]
    , cpus = os.cpus().length
    , count
    , match
    ;

  if (n === 'cpus') return cpus;
  if (match = n.toString().match(/cpus\s*\*\s*(\d+)/))
    return cpus * parseInt(match[1]);
  return parseInt(n);
}
