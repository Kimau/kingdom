function local_db() {
  this.put = function(key, value) {
    if(typeof(value) == "object")
      value = JSON.stringify(value);
    window.localStorage[key] = value;
  }

  this.get = function(key) {
    var value = window.localStorage[key];
    if(value == undefined) return undefined;
    else if(value[0] == "{") value = JSON.parse(value);
    else if(!isNaN(parseInt(value))) value = parseInt(value);

    return value;
  }

  this.del = function(key) {
    delete(window.localStorage[key]);
  }

  this.createKeyStream = function(options) {
    var l = [];
    for(k in window.localStorage) {
      if(
        (options.gt  == undefined || k >  options.gt)  &&
        (options.gte == undefined || k >= options.gte) &&
        (options.lt  == undefined || k >  options.lt)  &&
        (options.lte == undefined || k <= options.lte))
        l.push(k);

      if((options.limit > 0) && (options.limit >= l.length))
        break;
    }

    if(options.reverse)
      l.reverse();

    return l;
  }

  this.createReadStream

  return this;
}

function tok(cmd) {
  var b;
  var stack = [];
  cmd = cmd.replace(/[ \t]+/g, " ").split(" ");
  for(i=0; i<cmd.length; ++i) {
    var a = cmd[i].split("\"");
    if(a.length == 1)
      stack.push(cmd[i]);
    else if(b) {
      if(a[0]) stack.push(a[0]);
      b.push(stack);
      stack = b;
      b = undefined;
      if(a[1]) stack.push(a[1]);
    } else {
      if(a[0]) stack.push(a[0]);
      b = stack;
      stack = [];
      if(a[1]) stack.push(a[1]);
    }
  }
  return stack;
}

function local_server() {
  this.userTokens = {};
  this.db = new local_db();
  this.game = new kingdomGame(this.db, "TestGame");

  function makeError(cb, code, msg) { cb(code || 400, { content: msg }); }
  function makeJSON(cb, dataJSON) { cb(200, JSON.parse(JSON.stringify(dataJSON))); }

  this.create_user = function(cb, user, pass) {
    if(user.match(/^[A-Za-z][A-Za-z0-9]+$/) == null)
      return makeError(cb, 400, "Invalid User Name");

    if(this.db.get("user_" + user) !== undefined)
      return makeError(cb, 400, "Username already taken");

    this.db.put("user_" + user, pass);

    var token = "token_" + Date.now() + "_user";
    this.userTokens[token] = user;
    makeJSON(cb, {"content": "registered as _" + user + "_", "type":"login", "token":token});
  }

  this.login = function(cb, user, pass) {
    if(user.match(/^[A-Za-z][A-Za-z0-9]+$/) == null)
      return makeError(cb, 400, "Invalid User Name");
    var dbPass = this.db.get("user_" + user)
    if((dbPass === undefined) || (dbPass !== pass))
      return makeError(cb, 400, "Password doesn't match");

    var token = "token_" + Date.now() + "_user";
    this.userTokens[token] = user;
    makeJSON(cb, {"content": "logged in as _" + user + "_", "type":"login", "token":token});
  }

  this.logout = function(cb, token) {
    var user = this.userTokens[token];
    if(user == undefined)
      return makeError(cb, 400, "Invalid token are you logged in?");

    delete(this.userTokens[token]);
    makeJSON(cb, {"content": "logged out _" + user + "_", "type":"logout"});
  }

  this.__listUsers = function(cb) {
    var ul = this.db.listKeys("user");
    makeJSON(cb, {"users" : ul, "content" : "User List: " + ul.toString()});
  }

  this.submitCommand = function(cmd, token, cb) {
    var cmdSplit = tok(cmd);
    var echoConsole = true;
    if(cb == undefined) {
      cb = function(a,b) { console.log([a,JSON.stringify(b)]); };
    } else if(echoConsole) {
      actual_cb = cb;
      cb = function(a,b) { console.log([a,JSON.stringify(b)]); actual_cb(a,b); };
    }

    ////////////////////////////////////////////////////////////////////////////
    // Login Commands
    switch(cmdSplit[0]) {
      case "$user_list":
        this.__listUsers(cb);
        return;
      case "signup":
        this.create_user(cb, cmdSplit[1], cmdSplit[2]);
        return;
      case "login":
        this.login(cb, cmdSplit[1], cmdSplit[2]);
        return;
      case "logout":
        this.logout(cb, token);
        return;
    }

    var user = this.userTokens[token];
    if(user === undefined)
      return makeError(cb, 400, "Invalid Auth Token");

    ////////////////////////////////////////////////////////////////////////////
    // Admin Commands
    switch(cmdSplit[0]) {
      case "$user_list":
        this.__listUsers(cb);
        return;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Game Commands
    this.game.submitCommand(user, cmdSplit, function(result) {
      if(typeof(result) == "string")
      return makeError(cb, 500, result);
    else
      return makeJSON(cb, result);
    });
  }


  return this;
}

// Init
var server = new local_server();