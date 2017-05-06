const flatbuffers = require('flatbuffers');
const Assets = require('../../flatbuffers/schema').Assets;

const MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE = 10 * 1000; // 10 seconds

module.exports = class ConnectionHandler {
    constructor(socket, playerManager) {
        this.socket = socket;
        this.playerManager = playerManager;
        this.player = null;
    }

    start() {
        const ch = this;

        this.socket.on('data', input => ch.onData(input));

        this.socket.on('end', () => {
            if (ch.isAuthorized()) {
                ch.playerManager.disconnect(ch.player);
            }
        });

        // Disconnect client if not authorized within n seconds since connection
        setTimeout(() => {
            if (!ch.isAuthorized()) {
                ch.socket.destroy("No auth message within 10 seconds");
            }
        }, MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE);
    }

    onData(input) {
        const data = new Uint8Array(input);
        const buf = new flatbuffers.ByteBuffer(data);

        if (Assets.Code.Remote.LoginMsg.bufferHasIdentifier(buf)) {
            return this.onLoginMsg(Assets.Code.Remote.LoginMsg.getRootAsLoginMsg(buf));
        }
    }

    /**
     * @param {Assets.Code.Remote.LoginMsg} loginMsg
     */
    onLoginMsg(loginMsg) {
        const ch = this;

        this.playerManager.connect(loginMsg.token())
            .then(player => {
                ch.player = player;
                ch.player.connectionHandler = ch;
                // TODO: Success message
            })
            .catch(error => {
                // TODO: Fail message
            });
    }

    isAuthorized() {
        return !!this.player;
    }
};