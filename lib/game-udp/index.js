const dgram = require('dgram');
const debug = require('debug')('sectord17-game:game-udp');
const report = require('../errors/reporter');
const express = require('express');
const ConnectionManager = require('./connection-manager');

module.exports = function (playerManager) {
    const gameUdpApp = express();
    const port = parseInt(process.env.GAME_PORT) || 8000;

    const ip = process.env.IP || '127.0.0.1';
    const server = dgram.createSocket('udp4');

    const connectionManager = new ConnectionManager(server, playerManager);

    server.on('message', (message, rinfo) => {
        connectionManager.onMessage(message, rinfo);
    });

    server.on('error', error => {
        report(error);
    });

    server.on('listening', () => {
        const address = server.address();
        debug(`Listening on ${address.address}:${address.port}`);
    });

    server.bind(port, ip);

    gameUdpApp.connectionManager = connectionManager;

    return gameUdpApp;
};