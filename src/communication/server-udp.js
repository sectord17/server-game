const dgram = require('dgram');
const debug = require('debug')('sectord17-game:server-udp');
const Buffer = require('buffer').Buffer;
const report = include('/src/errors/reporter');
const flatbuffers = require('flatbuffers').flatbuffers;
const LoginAssets = include('/src/flatbuffers/LoginSchema_generated').Assets;
const ConnectingError = include('/src/errors/connecting-error');

class ServerUDP {
    constructor(port) {
        this.address = '0.0.0.0';
        this.port = parseInt(port) || 0;
        this.server = null;
    }

    use(dependencies) {
        /** @type {PlayerManager} */
        this.playerManager = dependencies.playerManager;

        /** @type {Lobby} */
        this.lobby = dependencies.lobby;
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
        if (communicationHandler === undefined) {
            debug(`Message from unregistered connection ${rinfo.address}:${rinfo.port}`);
            return;
        }

        communicationHandler.onUdpMessage(message, buf);
    }

    send(address, port, message) {
        const buffer = Buffer.from(message);
        this.server.send(buffer, 0, buffer.length, port, address);
    }

    getCommuncationHandlerByRinfo(rinfo) {
        return this.playerManager
            .getConnectedPlayers()
            .map(player => player.communicationHandler)
            .find(communicationHandler =>
                communicationHandler.address === rinfo.address && communicationHandler.udpPort === rinfo.port
            );
    }

    /**
     * @param {Assets.Code.Remote.Flat.LoginMsg} loginMsg
     * @param {*} rinfo
     */
    _onLoginMsg(loginMsg, rinfo) {
        this.playerManager
            .connect(loginMsg.token(), rinfo.address, rinfo.port)
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

module.exports = exports = ServerUDP;
