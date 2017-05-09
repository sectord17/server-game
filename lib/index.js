const PlayerManager = require('./player-manager');

module.exports = function (app) {
    app.playerManager = new PlayerManager(app);
    app.cli = require('./cli')(app);
    app.httpApp = require('./http')(app);
    app.gameApp = require('./game')(app);
};