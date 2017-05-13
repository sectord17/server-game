const winston = require('winston');
const dgram = require('dgram');
const debug = require('debug')('sectord17-game:game-udp');
const report = require('../../errors/reporter');
const ServerAssets = require('../../flatbuffers/ServerSchema_generated').Assets;
const ConnectingError = require('../../errors/connecting-error');

module.exports = class ServerUdp {
    constructor(address, port) {
        this.playerManager = require('../../player-manager');
        this.address = address;
        this.port = port;
        this.server = null;
    }

    start() {
        const server = dgram.createSocket('udp4');

        server.on('message', (message, rinfo) => this.onMessage(message, rinfo));

        server.on('error', error => report(error));

        server.on('listening', () => {
            const address = server.address();
            this.address = address.address;
            this.port = address.port;
            debug(`Listening on ${this.address}:${this.port}`);
        });

        server.bind(this.port, this.address);

        this.server = server;
    }

    onMessage(message, rinfo) {
        const data = new Uint8Array(message);
        const buf = new flatbuffers.ByteBuffer(data);

        if (ServerAssets.Code.Remote.LoginMsg.bufferHasIdentifier(buf)) {
            return this._onLoginMsg(ServerAssets.Code.Remote.LoginMsg.getRootAsLoginMsg(buf), rinfo);
        }

        const communicationHandler = this.getCommuncationHandlerByRinfo(rinfo);
        if (communicationHandler == null) {
            winston.log('warn', `Message from unregistered user ${rinfo.address}:${rinfo.port}`);
            return;
        }

        communicationHandler.onUdpMessage(message);
    }

    send(address, port, message) {
        return this.server.send(message, 0, message.length, port, address);
    }

    // TODO: Optimize it
    getCommuncationHandlerByRinfo(rinfo) {
        return this.playerManager
            .allConnected()
            .map(player => player.communicationHandler)
            .filter(communicationHandler => communicationHandler.address === rinfo.address && communicationHandler.udpPort === rinfo.port)
            .find(() => true);
    }

    /**
     * @param {Assets.Code.Remote.LoginMsg} loginMsg
     * @param {*} rinfo
     */
    _onLoginMsg(loginMsg, rinfo) {
        this.playerManager
            .connect(loginMsg.token(), rinfo.address, rinfo.port)
            .then(player => {
                // TODO: Send login ack
                // player.communicationHandler.sendViaTcp();
            })
            .catch(error => {
                if (error instanceof ConnectingError) {
                    if (error.player) {
                        this.playerManager.disconnect(error.player);
                    }

                    winston.info(`Player dropped during establishing UDP because of ${error.code}`);
                    return;
                }

                report(error);
            });
    }
};