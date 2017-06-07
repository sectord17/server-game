const winston = require('winston');
const dgram = require('dgram');
const debug = require('debug')('sectord17-game:server-udp');
const report = require('../../errors/reporter');
const flatbuffers = require('flatbuffers').flatbuffers;
const LoginAssets = require('../../flatbuffers/LoginSchema_generated').Assets;
const ConnectingError = require('../../errors/connecting-error');
const FlatBuffersHelper = require('../../flatbuffers/helper');

class ServerUdp {
    constructor() {
        this.playerManager = require('../../game/player-manager');
        this.lobby = require('../../game/lobby');
        this.address = process.env.IP || '0.0.0.0';
        this.port = parseInt(process.env.GAME_PORT) || 0;
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

        if (LoginAssets.Code.Remote.Flat.LoginMsg.bufferHasIdentifier(buf)) {
            return this._onLoginMsg(LoginAssets.Code.Remote.Flat.LoginMsg.getRootAsLoginMsg(buf), rinfo);
        }

        const communicationHandler = this.getCommuncationHandlerByRinfo(rinfo);
        if (communicationHandler == null) {
            winston.log('warn', `Message from unregistered user ${rinfo.address}:${rinfo.port}`);
            return;
        }

        communicationHandler.onUdpMessage(message, buf);
    }

    send(address, port, message) {
        this.server.send(message, 0, message.length, port, address);
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
     * @param {Assets.Code.Remote.Flat.LoginMsg} loginMsg
     * @param {*} rinfo
     */
    _onLoginMsg(loginMsg, rinfo) {
        this.playerManager
            .fullConnect(loginMsg.token(), rinfo.address, rinfo.port)
            .catch(error => {
                if (error instanceof ConnectingError) {
                    if (error.player) {
                        this.playerManager.disconnect(error.player);
                    }

                    debug(`Connection dropped during establishing UDP because of ${error.code}`);
                    return;
                }

                report(error);
            });
    }
}

const serverUdp = new ServerUdp();
serverUdp.start();
module.exports = serverUdp;