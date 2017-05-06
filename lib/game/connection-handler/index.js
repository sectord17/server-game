const flatbuffers = require('flatbuffers');
const Assets = require('../../flatbuffers/schema').Assets;

module.exports = class ConnectionHandler {
    constructor(socket, playerManager) {
        this.socket = socket;
        this.playerManager = playerManager;
        this.player = null;
    }

    start() {
        this.socket.on('data', (input) => {
            const data = new Uint8Array(input);
            const buf = new flatbuffers.ByteBuffer(data);
            const loginMsg = Assets.Code.Remote.LoginMsg.getRootAsLoginMsg(buf);

            this.onAuth(loginMsg.token());
        });

        this.socket.on('end', () => {
            if (this.isAuthorized()) {
                this.playerManager.disconnect(this.player);
            }
        });

        // Disconnect client if not authorized within n seconds since connection
        setTimeout(() => {
            if (!this.isAuthorized()) {
                this.socket.destroy("No auth message within 10 seconds");
            }
        }, 1000 * 10);
    }

    isAuthorized() {
        return !!this.player;
    }

    onAuth(token) {
        const ch = this;

        this.playerManager.connect(token)
            .then(player => {
                ch.player = player;
                ch.player.connectionHandler = ch;
                // TODO: Success message
            })
            .catch(error => {
                // TODO: Fail message
            });
    }
};