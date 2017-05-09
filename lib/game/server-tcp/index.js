const ConnectionHandler = require('./connection-handler');
const net = require('net');
const debug = require('debug')('sectord17-game:game-tcp');
const report = require('../../errors/reporter');
const app = require('../../../app');

module.exports = class ServerTcp {
    constructor(address, port) {
        this.address = address;
        this.port = port;
        this.server = null;
    }

    start() {
        const server = net.createServer();

        server.on('connection', socket => new ConnectionHandler(socket, app.playerManager).start());

        server.on('error', error => report(error));

        server.on('listening', () => {
            const address = server.address();
            debug(`Listening on ${address.address}:${address.port}`);
        });

        server.listen(this.port, this.address);

        this.server = server;
    }
};