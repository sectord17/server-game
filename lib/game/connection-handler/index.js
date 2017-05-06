const flatbuffers = require('flatbuffers').flatbuffers;
const ServerAssets = require('../../flatbuffers/server-schema').Assets;
const PositionAssets = require('../../flatbuffers/position-schema').Assets;
const debug = require('debug')('sectord17-game:connection-handler');

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

            console.log(`Player #${ch.player.id} disconnected`);
            debug(ch.player);
        });

        // Disconnect client if not authorized within n seconds since connection
        setTimeout(() => {
            if (!ch.isAuthorized()) {
                ch.socket.end();
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
        const ch = this;

        this.playerManager.connect(loginMsg.token())
            .then(player => {
                ch.player = player;
                ch.player.connectionHandler = ch;

                console.log(`Player #${ch.player.id} connected`);
                debug(ch.player);
            })
            .catch(error => debug(error));
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