const flatbuffers = require('flatbuffers').flatbuffers;
const ServerAssets = require('../../flatbuffers/ServerSchema_generated').Assets;
const debug = require('debug')('sectord17-game:connection-handler');
const app = require('../../../app');

const MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE = 10 * 1000; // 10 seconds

module.exports = class ConnectionHandler {
    constructor(socket) {
        this.socket = socket;
        this.communicationHandler = null;
    }

    start() {
        this.socket.on('data', message => this.onMessage(message));

        this.socket.on('close', () => {
            if (this.isConnected()) {
                app.playerManager.disconnect(this.communicationHandler.player);
            }
        });

        // Disconnect client if not authorized within n seconds since connection
        setTimeout(() => {
            if (!this.isConnected()) {
                this.socket.end();
            }
        }, MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE);
    }

    onMessage(message) {
        const data = new Uint8Array(message);
        const buf = new flatbuffers.ByteBuffer(data);

        if (!this.isConnected()) {
            if (ServerAssets.Code.Remote.LoginMsg.bufferHasIdentifier(buf)) {
                return this._onLoginMsg(ServerAssets.Code.Remote.LoginMsg.getRootAsLoginMsg(buf));
            }

            return debug("First message must be loginmsg");
        }

        this.communicationHandler.onTcpMessage(message, buf);
    }

    send(message) {
        this.socket.write(message);
    }

    isConnected() {
        return this.communicationHandler;
    }

    close() {
        this.socket.end();
    }

    /**
     * @param {Assets.Code.Remote.LoginMsg} loginMsg
     */
    _onLoginMsg(loginMsg) {
        app.playerManager
            .connect(loginMsg.token(), loginMsg.name(), this.socket.address().address, 8000/*loginMsg.udpPort()*/, this)
            .then(player => this.communicationHandler = player.communicationHandler)
            .catch(error => console.log(error));
    }
};
