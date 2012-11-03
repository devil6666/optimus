## About

Optimus is a simple cluster manager for node.js, built off the native
cluster module. Requires node v0.8.0 or higher.

Optimus receives a configuration object, which contains the names of
applications to run, and the number of instances to spawn of each
application.

The number of instances can either be a number, or the string "cpus".
You can also perform multiplication on "cpus".

Here is an example of how to use optimus.

```javascript
var optimus = require("optimus");

optimus.start({
  "myapp": 1,
  "dont_restart": {
    "count": 1,
    "autoRestart": false
  },
  "cleaner": "cpus*2",
  "myworker": "cpus"
}, __dirname);
```

See LICENSE for copyright info.
