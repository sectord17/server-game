const dgram = require('dgram');
const debug = require('debug')('sectord17-game:game-udp');
const report = require('../../errors/reporter');
const app = require('../../../app');

module.exports = class ServerUdp {
    constructor(address, port) {
        this.app = app;
        this.address = address;
        this.port = port;
        this.server = null;
    }

    start() {
        const server = dgram.createSocket('udp4');

        server.on('message', (message, rinfo) => this.onMessage(rinfo, message));

        server.on('error', error => report(error));

        server.on('listening', () => {
            const address = server.address();
            debug(`Listening on ${address.address}:${address.port}`);
        });

        server.bind(this.port, this.address);

        this.server = server;
    }

    onMessage(rinfo, message) {
        const communicationHandler = this.getCommuncationHandlerByRinfo(rinfo);

        communicationHandler.onUdpMessage(message);
    }

    send(address, port, message) {
        return this.server.send(message, 0, message.length, port, address);
    }

    // TODO
    getCommuncationHandlerByRinfo(rinfo) {
        return app.playerManager.all()
            .map(player => player.communicationHandler)
            .filter(communicationHandler => communicationHandler.address === rinfo.address && communicationHandler.port === rinfo.port)
            .get(0)
    }
};