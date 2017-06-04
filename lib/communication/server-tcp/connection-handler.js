const flatbuffers = require('flatbuffers').flatbuffers;
const LoginAssets = require('../../flatbuffers/LoginSchema_generated').Assets;
const debug = require('debug')('sectord17-game:connection-handler');
const winston = require('winston');
const report = require('../../errors/reporter');

const ConnectingError = require('../../errors/connecting-error');

const MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE = 10 * 1000; // 10 seconds

module.exports = class ConnectionHandler {
    constructor(socket) {
        this.playerManager = require('../../game/player-manager');
        this.socket = socket;
        this.communicationHandler = null;
    }

    start() {
        this.socket.on('data', message => this.onMessage(message));

        this.socket.on('close', () => {
            if (this.communicationHandler) {
                this.playerManager.disconnect(this.communicationHandler.player);
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

        if (this.communicationHandler) {
            return this.communicationHandler.onTcpMessage(message, buf);
        }

        if (LoginAssets.Code.Remote.Flat.LoginMsg.bufferHasIdentifier(buf)) {
            return this._onLoginMsg(LoginAssets.Code.Remote.Flat.LoginMsg.getRootAsLoginMsg(buf));
        }

        debug("First message must be loginmsg");
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
     * @param {Assets.Code.Remote.Flat.LoginMsg} loginMsg
     */
    _onLoginMsg(loginMsg) {
        this.playerManager
            .authorize(loginMsg.token(), loginMsg.name(), this)
            .then(player => this.communicationHandler = player.communicationHandler)
            .catch(error => {
                this.close();

                if (error instanceof ConnectingError) {
                    if (error.player) {
                        this.playerManager.disconnect(error.player);
                    }

                    debug(`Connection dropped during establishing TCP because of ${error.code}`);
                    return;
                }

                report(error);
            });
    }
};
