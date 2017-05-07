const flatbuffers = require('flatbuffers').flatbuffers;
const ServerAssets = require('../../flatbuffers/ServerSchema_generated').Assets;
const PositionAssets = require('../../flatbuffers/PositionSchema_generated').Assets;
const debug = require('debug')('sectord17-game:connection-handler');

const MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE = 10 * 1000; // 10 seconds

module.exports = class ConnectionHandler {
    constructor(socket, playerManager) {
        this.socket = socket;
        this.playerManager = playerManager;
        this.player = null;
    }

    start() {
        this.socket.on('data', input => this.onData(input));

        this.socket.on('close', () => {
            if (this.isAuthorized()) {
                this.playerManager.disconnect(this.player);
            }

            console.log(`Player #${this.player.id} disconnected`);
        });

        // Disconnect client if not authorized within n seconds since connection
        setTimeout(() => {
            if (!this.isAuthorized()) {
                this.socket.end();
            }
        }, MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE);
    }

    onData(input) {
        const data = new Uint8Array(input);
        const buf = new flatbuffers.ByteBuffer(data);

        if (ServerAssets.Code.Remote.LoginMsg.bufferHasIdentifier(buf)) {
            debug("On LoginMsg");
            return this.onLoginMsg(ServerAssets.Code.Remote.LoginMsg.getRootAsLoginMsg(buf));
        }

        if (PositionAssets.Code.Remote.GameData.bufferHasIdentifier(buf)) {
            debug(`On GameData from player #${this.player.id}`);
            return this.onGameData(input, PositionAssets.Code.Remote.GameData.getRootAsGameData(buf));
        }
    }

    /**
     * @param {Assets.Code.Remote.LoginMsg} loginMsg
     */
    onLoginMsg(loginMsg) {
        this.playerManager.connect(loginMsg.token())
            .then(player => {
                this.player = player;
                this.player.connectionHandler = this;

                console.log(`Player #${this.player.id} connected`);
            })
            .catch(error => console.log(error));
    }

    /**
     * @param {*} input
     * @param {Assets.Code.Remote.GameData} gameData
     */
    onGameData(input, gameData) {
        this.playerManager.all()
            .filter(player => player.id !== this.player.id)
            .forEach(player => player.connectionHandler.socket.write(input));
    }

    isAuthorized() {
        return !!this.player;
    }
};
