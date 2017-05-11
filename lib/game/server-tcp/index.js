const ConnectionHandler = require('./connection-handler');
const net = require('net');
const debug = require('debug')('sectord17-game:game-tcp');
const report = require('../../errors/reporter');

module.exports = class ServerTcp {
    constructor(address, port) {
        this.address = address;
        this.port = port;
        this.server = null;
    }

    start() {
        const server = net.createServer();

        server.on('connection', socket => new ConnectionHandler(socket).start());

        server.on('error', error => report(error));

        server.on('listening', () => {
            const address = server.address();
            this.address = address.address;
            this.port = address.port;
            debug(`Listening on ${this.address}:${this.port}`);
        });

        server.listen(this.port, this.address);

        this.server = server;
    }
};