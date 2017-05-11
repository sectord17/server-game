const express = require('express');
const ServerTcp = require('./server-tcp');
const ServerUdp = require('./server-udp');

const gameApp = express();

const port = parseInt(process.env.GAME_PORT) || 0;
const address = process.env.IP || '0.0.0.0';

module.exports = gameApp;

gameApp.serverTcp = new ServerTcp(address, port);
gameApp.serverUdp = new ServerUdp(address, port);

gameApp.serverTcp.start();
gameApp.serverUdp.start();
