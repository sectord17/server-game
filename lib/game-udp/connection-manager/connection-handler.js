const flatbuffers = require('flatbuffers').flatbuffers;
const ServerAssets = require('../../flatbuffers/ServerSchema_generated').Assets;
const PositionAssets = require('../../flatbuffers/PositionSchema_generated').Assets;
const debug = require('debug')('sectord17-game:udp-connection-handler');

module.exports = class ConnectionHandler {
    constructor(rinfo, playerManager, connectionManager) {
        this.rinfo = rinfo;
        this.playerManager = playerManager;
        this.connectionManager = connectionManager;
        this.player = null;
    }

    onMessage(message) {
        const data = new Uint8Array(message);
        const buf = new flatbuffers.ByteBuffer(data);

        if (ServerAssets.Code.Remote.LoginMsg.bufferHasIdentifier(buf)) {
            return this.onLoginMsg(ServerAssets.Code.Remote.LoginMsg.getRootAsLoginMsg(buf));
        }

        if (!this.isAuthorized()) {
            debug(`Message from unauthorized client ${this.address()}`);
            return;
        }

        if (PositionAssets.Code.Remote.GameData.bufferHasIdentifier(buf)) {
            return this.onGameData(message);
        }

        debug(`Unknown identifier from ${this.address()}`);
    }

    /**
     * @param {Assets.Code.Remote.LoginMsg} loginMsg
     */
    onLoginMsg(loginMsg) {
        this.playerManager.connect(loginMsg.token())
            .then(player => {
                this.player = player;
                this.player.udpConnectionHandler = this;

                console.log(`Player #${this.player.id} connected`);
            })
            .catch(error => console.log(error));
    }

    onGameData(input) {
        this.connectionManager.sendToEachPlayer(input, player => player.id !== this.player.id);
    }

    isAuthorized() {
        return !!this.player;
    }

    address() {
        return `${this.rinfo.address}:${this.rinfo.port}`;
    }
};
