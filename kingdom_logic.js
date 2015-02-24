function kingdomGame(db, gameName) {
  this.gameName;
  this.gameID;

  this.createGame = function(gameName) {
    this.gameName = gameName;

    // Create Game ID
    var topNum = db.get("game_root_max") || 0;
    db.put("game_root_max", topNum+1);
    this.gameID = topNum;

    this.saveGameRoot();
  }

  this.toJSON = function() {
    return {
      "n":this.gameName,
      "id":this.gameID
    };
  }

  this.saveGameRoot = function() {
    db.put("game_" + topNum, this.toJSON());
  }

  this.joinGame = function(user) {

  }

  this.createGame(gameName)

  return this;
}