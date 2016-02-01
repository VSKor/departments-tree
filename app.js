var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require("fs");
var port = 1313;
var MD = {};

Object.defineProperties(MD, {
  RULES: {
    enumerable: true,
    configurable: false,
    writable: false,
    value: {
      director: {
        max: 1,
        sub: "vice"
      },
      vice: {
        max: 3,
        sub: "contractor"
      },
      contractor: {
        max: 4,
        sub: "courier"
      },
      courier: {
        max: 5
      }
    }
  },
  getUsers: {
    enumerable: false,
    value: function (callback) {
      var _this = this;
      fs.readFile("publish/users.json", function (err, data) {
        if (err) {
          throw err;
        }
        _this.users = JSON.parse(data);

        if (callback) {
          callback.call(_this);
        }

        return _this.users;
      });
    }
  },
  saveUsers: {
    enumerable: false,
    value: function (users) {
      fs.writeFile("publish/users.json", JSON.stringify(users, null, "\t"), function (err) {
        if (err) {
          throw err;
        }
      })
    }
  },
  mapUsers: {
    enumerable: false,
    value: function (users, callback) {
      users = users || this.users;
      users = users.hasOwnProperty("uid") ? [users] : users;
      for (var i in users) {
        if (callback) {
          callback(users[i]);
        }

        if (users[i].hasOwnProperty("department")) {
          this.mapUsers(users[i].department, callback);
        }
      }
    }
  }
});


// Express configuration
app.use(express.static(__dirname + '/publish'));   // set the static files location /public
app.use(bodyParser.json());                       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies

server.listen(port);

// application -------------------------------------------------------------
app.get('*', function (req, res) {
  res.sendfile('./publish/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

io.on('connection', function (socket) {
  MD.getUsers(function () {
    socket.emit("init", MD);
  });

  socket
    .on("saveTree", function (data) {
      MD.saveUsers(data);
    })
    .on("error", function (err) {
      console.log(err);
    });
});