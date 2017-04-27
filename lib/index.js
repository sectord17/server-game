module.exports = function (app) {
    app.playerManager = require('./player-manager')(app);
    app.cli = require('./cli')(app);
    app.httpApp = require('./http')(app);
    app.gameApp = require('./game')(app);
};