const flatbuffers = require('flatbuffers').flatbuffers;
const ServerAssets = require('../../flatbuffers/ServerSchema_generated').Assets;
const PositionAssets = require('../../flatbuffers/PositionSchema_generated').Assets;
const debug = require('debug')('sectord17-game:connection-handler-tcp');

const MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE = 10 * 1000; // 10 seconds

module.exports = class ConnectionHandlerTcp {
    constructor(socket, playerManager) {
        this.socket = socket;
        this.playerManager = playerManager;
        this.player = null;
    }

    start() {
        this.socket.on('data', message => this.onMessage(message));

        this.socket.on('close', () => {
            if (this.isAuthorized()) {
                this.playerManager.disconnect(this.player);
            }
        });

        // Disconnect client if not authorized within n seconds since connection
        setTimeout(() => {
            if (!this.isAuthorized()) {
                this.socket.end();
            }
        }, MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE);
    }

    onMessage(message) {
        const data = new Uint8Array(message);
        const buf = new flatbuffers.ByteBuffer(data);

        if (!this.isAuthorized()) {
            if (ServerAssets.Code.Remote.LoginMsg.bufferHasIdentifier(buf)) {
                return this.onLoginMsg(ServerAssets.Code.Remote.LoginMsg.getRootAsLoginMsg(buf));
            }

            return debug("First message must be loginmsg");
        }

        if (PositionAssets.Code.Remote.GameData.bufferHasIdentifier(buf)) {
            return this.onGameData(message);
        }

        debug("Unknown messageidentifier");
    }

    /**
     * @param {Assets.Code.Remote.LoginMsg} loginMsg
     */
    onLoginMsg(loginMsg) {
        this.playerManager.connect(loginMsg.token())
            .then(player => {
                player.setConnectedViaTcp(this);
                this.player = player;
            })
            .catch(error => console.log(error));
    }

    onGameData(message) {
        this.playerManager.all()
            .filter(player => player.id !== this.player.id && player.connectionHandlerTcp)
            .forEach(player => player.connectionHandlerTcp.socket.write(message));
    }

    disconnect() {
        this.socket.end();
    }

    isAuthorized() {
        return !!this.player;
    }
};
