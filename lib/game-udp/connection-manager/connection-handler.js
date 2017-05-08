const flatbuffers = require('flatbuffers').flatbuffers;
const PositionAssets = require('../../flatbuffers/PositionSchema_generated').Assets;
const ConnectionManager = require('../connection-manager');
const debug = require('debug')('sectord17-game:udp-connection-handler');

module.exports = class ConnectionHandler {
    /**
     * @param rinfo
     * @param {Player} player
     * @param playerManager
     * @param connectionManager
     */
    constructor(rinfo, player, playerManager, connectionManager) {
        this.rinfo = rinfo;
        this.player = player;
        this.playerManager = playerManager;
        this.connectionManager = connectionManager;
    }

    onMessage(message) {
        const data = new Uint8Array(message);
        const buf = new flatbuffers.ByteBuffer(data);

        if (PositionAssets.Code.Remote.GameData.bufferHasIdentifier(buf)) {
            return this.onGameData(message);
        }

        debug(`Unknown identifier from ${this.key()}`);
    }

    onGameData(message) {
        this.connectionManager.sendToEachPlayer(message, player => player.id !== this.player.id);
    }

    key() {
        return ConnectionManager.makeKey(this.rinfo);
    }
};
