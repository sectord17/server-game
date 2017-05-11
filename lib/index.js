const express = require('express');
const logger = require('morgan');
const PlayerManager = require('./player-manager');

const app = express();

app.use(logger('dev'));

app.playerManager = new PlayerManager();
app.cli = require('./cli');
app.httpApp = require('./http');
app.gameApp = require('./game');

module.exports = app;