const flatbuffers = require('flatbuffers').flatbuffers;
const LoginAssets = include('/src/flatbuffers/LoginSchema_generated').Assets;
const debug = require('debug')('sectord17-game:connection-handler');
const report = include('/src/errors/reporter');
const ConnectingError = include('/src/errors/connecting-error');
const {prependLength, splitData} = require('./utils');

class ConnectionHandler {
    constructor(socket) {
        const {playerManager} = include('/src');

        this.playerManager = playerManager;
        this.socket = socket.setNoDelay(true);
        this.communicationHandler = null;
    }

    start() {
        this.socket
            .on('data', data => splitData(data, message => this.onMessage(message)))
            .on('close', () => {
                if (this.communicationHandler) {
                    this.playerManager.disconnect(this.communicationHandler.player);
                }
            })
            .on('error', error => {
                if (this.communicationHandler) {
                    this.playerManager.disconnect(this.communicationHandler.player);
                }
                this.close();

                debug(error);
            });
    }

    onMessage(message) {
        const buf = new flatbuffers.ByteBuffer(message);

        if (this.communicationHandler) {
            return this.communicationHandler.onTcpMessage(message, buf);
        }

        if (LoginAssets.Code.Remote.Flat.LoginMsg.bufferHasIdentifier(buf)) {
            return this._onLoginMsg(LoginAssets.Code.Remote.Flat.LoginMsg.getRootAsLoginMsg(buf));
        }

        debug("First message must be loginmsg");
    }

    send(message) {
        this.socket.write(prependLength(message));
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
}

module.exports = exports = ConnectionHandler;
