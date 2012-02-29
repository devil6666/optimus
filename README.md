## About

Optimus is a simple cluster manager for node.js, built off the native
cluster module. Requires node v0.6.0 or higher.

Optimus receives a configuration object, which contains the names of
applications to run, and the number of instances to spawn of each
application.

The number of instances can either be a number, or the string "cpus".
You can also perform arithmetic operations on "cpus".

Here is an example of how to use optimus.

```javascript
var optimus = require("optimus")
  , config = {
      "myapp": 1,
      "cleaner": "cpus/2",
      "myworker": "cpus"
    };

optimus.start(config, __dirname);
```

See LICENSE for copyright info.
