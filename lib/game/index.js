const express = require('express');
const ServerTcp = require('./server-tcp');
const ServerUdp = require('./server-udp');

module.exports = function (app) {
    const gameApp = express();

    const port = parseInt(process.env.GAME_PORT) || 8000;
    const address = process.env.IP || '127.0.0.1';

    gameApp.serverTcp = new ServerTcp(address, port);
    gameApp.serverUdp = new ServerUdp(address, port);

    gameApp.serverTcp.start();
    gameApp.serverUdp.start();

    return gameApp;
};