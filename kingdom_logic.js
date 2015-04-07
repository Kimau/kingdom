function kingdomGame(db, gameName) {
  this.gameName;
  this.gameID;
  this.userList;
  this.jobList;

  this.CreateGame = function(gameName) {
    this.gameName = gameName;

    // Create Game ID
    var topNum = db.get("game_root_max") || 0;
    db.put("game_root_max", parseInt(topNum)+1);
    this.gameID = topNum;

    // User
    this.userList = {};
    this.jobList = [];

    this.SaveGameRoot();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Save Functions
  this.SavePlot = function(user, pDat) {
    db.put("game_" + this.gameID + "_user_" + user + "_plot_" + pid, {
        plotType:pDat.plotType
      });
  }

  this.SaveUser = function(user, ud) {
    db.put("game_" + this.gameID + "_user_" + user, {
      name:ud.name,
      plotSize:ud.plotSize
    });

    for(pid in ud.plots) {
      this.SavePlot(user, ud.plots[pid]);
    }
  }

  this.SaveGameRoot = function() {
    var ulKeys = [];
    for(u in this.userList) {
      ulKeys.push(u);
      this.SaveUser(u, this.userList[u]);
    }

    db.put("game_" + this.gameID, {
      n:this.gameName,
      id:this.gameID,
      ul: ulKeys
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  // Load Functions
  this.LoadPlot = function(user, pid) {
    var pt = db.get("game_" + this.gameID + "_user_" + user + "_plot_" + pid);
    pt.type = "plot";
    return pt;
  }

  this.LoadUser = function(user) {
    var ud = db.get("game_" + this.gameID + "_user_" + user);

    var newPlotList = [];
    for(var pid=0; pid < (ud.plotSize[0]*ud.plotSize[1]); ++pid) {
      newPlotList.push(this.LoadPlot(user, pid));
    }
    ud.plots = newPlotList;

    return ud;
  }

  this.LoadGameRoot = function() {
    var ulKeys = [];
    for(u in this.userList) {
      ulKeys.push(u);
      this.SaveUser(u, this.userList[u]);
    }

    var lGame = db.get("game_" + this.gameID);
    this.gameName = lGame.n;
    this.userList = {};
    for(var uid=0; uid < lGame.ul.length; ++uid) {
      var u = lGame.ul[uid];
      this.userList[u] = this.LoadUser(u);
    };

    this.jobList = [];
  }

  //////////////////////////////////////////////////////////////////////////////
  // Util Functions
  function SecondsToDate(seconds) { return seconds*1000; }
  function JobPercentage(job) { return parseInt((Date.now() - job.startTime) * 100 / job.buildTime); }

  //////////////////////////////////////////////////////////////////////////////
  // Printers
  this.PrintPlotText = function(plotSize, plotLines, pd) {
    if(pd.jobRef >= 0) {
      var jp = JobPercentage(this.jobList[pd.jobRef]);
      jp = (jp < 10)?" "+jp:jp;
      if(plotSize == 1) plotLines[0] += "#";
        else if(plotSize == 2) { plotLines[0] += jp; plotLines[1] += "##"; }
        else if(plotSize == 3) {
          plotLines[0] += "###";
          plotLines[1] += jp+"%";
          plotLines[2] += "###";
        }
        else {
          var plotHeight = Math.ceil(plotSize / 2.0);
          for(var x=0; x<plotSize; ++x) {
            plotLines[0] += "#";
            plotLines[plotHeight-1] += "#";
          }
          for(var y=1; y<(plotHeight-1); ++y) {
            plotLines[y] += "#"
            if(parseInt(plotHeight/2) == y) {
              for(var x=1; x<(plotSize-4); ++x)
                plotLines[y] += " ";
              plotLines[y] += jp + "%";
              plotLines[y] += "#";
            } else {
              plotLines[y] += "#"
              for(var x=1; x<(plotSize-1); ++x) {
                plotLines[y] += " ";
              }
              plotLines[y] += "#"
            }
          }

          for(var y=1; y<(plotHeight-1); ++y)

          plotLines = plotLines.slice(0,plotHeight);
        }
        return plotLines;
    }

    switch(pd.plotType) {
      case "grassland":
        if(plotSize == 1) plotLines[0] += "_";
        else if(plotSize == 2) { plotLines[0] += "  "; plotLines[1] += "__"; }
        else if(plotSize == 3) {
          plotLines[0] += "   ";
          plotLines[1] += "   ";
          plotLines[2] += "___";
        }
        else {
          var plotHeight = Math.ceil(plotSize / 2.0);
          for(var y=0; y<plotHeight; ++y)
            for(var x=0; x<plotSize; ++x)
              plotLines[y] += (Math.random()>0.8)?",":" ";
          plotLines = plotLines.slice(0,plotHeight);
        }
    }
    return plotLines;
  }

  function MakePlot(name) {
    switch(name) {
      case "grassland": return new function() { return { type: "plot", plotType: "grassland" }; };
      default: console.error("Unknown Plot Type");
    }
  }

  this.PrintPlot = function(cb, user) {
    var ud = this.userList[user];

    var textWidth = 79;
    var plotSize = Math.min(6, parseInt((textWidth-2) / ud.plotSize[0]) || 1);
    textWidth = 2 + plotSize * ud.plotSize[0];
    console.log([textWidth, plotSize]);

    var blankLine = " ";
    while(blankLine.length < textWidth) blankLine += " ";

    var textOuput = [];
    var line = "Game: " + this.gameName;
    while(line.length < (textWidth - ud.name.length)) line += " ";
    line += ud.name;
    textOuput.push(line);

    for(var y = 0; y < ud.plotSize[1]; ++y) {
      var plotLines = [];
      for(var p = 0; p < plotSize; ++p) {
        plotLines[p] = "|";
      }

      for(var x = 0; x < ud.plotSize[0]; ++x) {
        plotLines = this.PrintPlotText(plotSize, plotLines, ud.plots[x + y*ud.plotSize[0]]);

        plotLines[plotLines.length-1] =
          plotLines[plotLines.length-1].slice(0,plotLines[plotLines.length-1].length-2) +
          String.fromCharCode("A".charCodeAt(0) + y) + x;
      }

      for(var p = 0; p < plotLines.length; ++p) {
        plotLines[p] += "|";
        textOuput.push(plotLines[p]);
      }
    }

    textOuput = textOuput.reduce(function(a,b) { return a + "\n" + b;});

    cb({"content":textOuput});
  }

  this.JoinGame = function(cb, user) {
    if(this.userList[user])
      return cb("User already exsists");

    var newUser = {
      "name" : user,
      "plotSize": [4,4],
      "plots": []
    };

    // Make Plot
    newUser.plotSize = [4,4];
    newUser.plots = [];
    for(var i = newUser.plotSize[0] * newUser.plotSize[1]; i > 0; --i) {
      newUser.plots.push(MakePlot("grassland"));
    }

    this.userList[user] = newUser;
    this.SaveGameRoot();
    this.PrintPlot(cb, user);
  }

  this.BuildPlot = function(cb, user, type, loc) {
    var ud = this.userList[user];

    loc = loc.toLowerCase();

    var pos = [
      parseInt(loc[1]),
      parseInt(loc[0].charCodeAt(0) - "a".charCodeAt(0)) ];
    var pid = pos[0] + pos[1]* ud.plotSize[0];

    if(ud.plots[pid].plotType !== "grassland") {
      return cb("Cannot build on " + ud.plotType);
    }

    switch(type.toLowerCase()) {
      case "farm":
        var newJob = {type:"job_build", building:"farm", user: "user", level:"1", startTime: Date.now(), buildTime: SecondsToDate(10)};
        this.jobList.push(newJob);
        ud.plots[pid].jobRef = this.jobList.length - 1;
        return cb({content:"Building new farm at " + loc});
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Key Process Command Function
  this.submitCommand = function(user, cmdSplit, cb) {
    switch(cmdSplit[0]) {
      case "join":
        return this.JoinGame(cb, user);
    }

    if(this.userList[user] == undefined)
      return cb("User " + user + " is not in game");

    switch(cmdSplit[0]) {
      case "map":
        return this.PrintPlot(cb, user);
      case "build":
        return this.BuildPlot(cb, user, cmdSplit[1], cmdSplit[2]);
    }

    cb("Unknown command [" + cmdSplit + "]");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Game Creation Logic
  if(db.get("game_0")) {
    this.gameID = 0;
    this.LoadGameRoot();
  } else {
    this.CreateGame(gameName);
  }

  return this;
}