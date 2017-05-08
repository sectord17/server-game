const express = require('express');

module.exports = function (app) {
    const gameApp = express();

    let port = parseInt(process.env.GAME_PORT) || 8000;
    let ip = process.env.IP || '127.0.0.1';

    gameApp.serverTcp = require('./server-tcp')(ip, port, app.playerManager);
    gameApp.serverUdp = require('./server-udp')(ip, port, app);

    return gameApp;
};