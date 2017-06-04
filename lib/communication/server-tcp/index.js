const ConnectionHandler = require('./connection-handler');
const net = require('net');
const debug = require('debug')('sectord17-game:server-tcp');
const report = require('../../errors/reporter');

class ServerTcp {
    constructor() {
        this.address = process.env.IP || '0.0.0.0';
        this.port = parseInt(process.env.GAME_PORT) || 0;
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
}

const serverTcp = new ServerTcp();
serverTcp.start();
module.exports = serverTcp;
