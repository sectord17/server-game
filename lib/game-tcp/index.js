const ConnectionHandler = require('./connection-handler');
const raven = require('raven');
const express = require('express');
const net = require('net');
const debug = require('debug')('sectord17-game:game-tcp');
const report = require('../errors/reporter');

module.exports = function (app) {
    const gameApp = express();

    let port = parseInt(process.env.GAME_PORT) || 8000;
    let ip = process.env.IP || '127.0.0.1';

    let server = net.createServer((socket) => new ConnectionHandler(socket, app.playerManager).start());
    server.listen(port, ip);

    server.on('error', error => report(error));

    server.on('listening', () => {
        const address = server.address();
        debug(`Listening on ${address.address}:${address.port}`);
    });

    return gameApp;
};