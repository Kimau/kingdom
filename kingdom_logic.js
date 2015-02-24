function kingdomGame(db) {
  this.gameID;

  this.createGame = function(gameName) {
    // Create Game ID
    var topNum = db.get("game_root_max") || 0;
    db.put("game_root_max", topNum+1);
    db.put("game_" + topNum);
    this.gameID = topNum;
  } 

  this.joinGame = function(user) {

  }

  return this;
}