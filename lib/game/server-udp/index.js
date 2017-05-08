const dgram = require('dgram');
const debug = require('debug')('sectord17-game:game-udp');
const report = require('../../errors/reporter');
const ConnectionManagerUdp = require('./connection-manager-udp');

module.exports = function (ip, port, app) {
    const server = dgram.createSocket('udp4');

    const connectionManagerUdp = new ConnectionManagerUdp(server, app.playerManager);

    server.on('message', (message, rinfo) => connectionManagerUdp.onMessage(message, rinfo));

    server.on('error', error => report(error));

    server.on('listening', () => {
        const address = server.address();
        debug(`Listening on ${address.address}:${address.port}`);
    });

    server.bind(port, ip);

    app.gameApp.connectionManagerUdp = connectionManagerUdp;

    return server;
};