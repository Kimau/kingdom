function local_db() {
  this.put = function(key, value) {
    window.localStorage[key] = value;
  }

  this.get = function(key) {
    return window.localStorage[key];
  }

  this.listKeys = function(keyPrefix) {
    var l = [];
    for(k in window.localStorage) {
      if(k.indexOf("user_") == 0) l.push(k);
    }
    return l;
  }

  return this;
}

function local_server() {
  this.userTokens = {};
  this.db = new local_db();
  this.game = new kingdomGame(this.db);

  this.makeError = function(msg, code) { return [code || 400, { text: msg }]; }
  this.makeJSON = function(dataJSON) {
    var jo = JSON.parse(JSON.stringify(dataJSON));
    return [200,jo];
  }

  this.create_user = function(user, pass) {
    if(user.match(/^[A-Za-z][A-Za-z0-9]+$/) == null)
      return this.makeError("Invalid User Name");

    if(this.db.get("user_" + user) !== undefined)
      return this.makeError("Username already taken");

    this.db.put("user_" + user, pass);

    var token = "token_" + Date.now() + "_user";
    this.userTokens[token] = user;
    return this.makeJSON({"content": "registered as _" + user + "_", "type":"login", "token":token});
  }

  this.login = function(user, pass) {
    if(user.match(/^[A-Za-z][A-Za-z0-9]+$/) == null)
      return this.makeError("Invalid User Name");
    var dbPass = this.db.get("user_" + user)
    if((dbPass === undefined) || (dbPass !== pass))
      return this.makeError("Password doesn't match");

    var token = "token_" + Date.now() + "_user";
    this.userTokens[token] = user;
    return this.makeJSON({"content": "logged in as _" + user + "_", "type":"login", "token":token});
  }

  this.__listUsers = function() {
    var ul = this.db.listKeys("user");
    return this.makeJSON({"users" : ul, "content" : "User List: " + ul.toString()});
  }

  this.submitCommand = function(cmd, token, cb) {
    var cmdSplit;
    if(cb == undefined) {
      cb = function(a,b) { console.log([a,JSON.stringify(b)]); };
    }

    if(cmd[0] == "$") {
      // ADMIN command
      cmdSplit = cmd.match(/^\$user_list$/);
      if(cmdSplit) {
        var x = this.__listUsers();
        cb(x[0],x[1]);
        return;
      }
    }

    cmdSplit = cmd.match(/^signup ([A-Za-z][A-Za-z0-9]+) ([^ ]+)$/);
    if(cmdSplit) {
      var x = this.create_user(cmdSplit[1], cmdSplit[2]);
      cb(x[0],x[1]);
      return;
    }

    cmdSplit = cmd.match(/^login ([A-Za-z][A-Za-z0-9]+) ([^ ]+)$/);
    if(cmdSplit) {
      var x = this.login(cmdSplit[1], cmdSplit[2]);
      cb(x[0],x[1]);
      return;
    }

    cmdSplit = cmd

    var user = this.userTokens[token];
    if(user === undefined)
      return this.makeError("Invalid Auth Token");

    //

    return this.makeError("Unknown Command");
  }
  return this;
}

// Init
var server = new local_server();