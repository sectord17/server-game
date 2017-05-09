const flatbuffers = require('flatbuffers').flatbuffers;
const PositionAssets = require('../../flatbuffers/PositionSchema_generated').Assets;
const debug = require('debug')('sectord17-game:communication-handler');

module.exports = class CommunicationHandler {
    /**
     * @param {Player} player
     * @param {ConnectionHandler} connectionHandler
     * @param {PlayerManager} playerManager
     * @param {ServerUdp} serverUdp
     */
    constructor(player, connectionHandler, playerManager, serverUdp) {
        this.player = player;
        this.connectionHandler = connectionHandler;
        this.playerManager = playerManager;
        this.serverUdp = serverUdp;
    }

    onTcpMessage(message, buf) {
        debug("Unknown message identifier");
    }

    onUdpMessage(message) {
        const data = new Uint8Array(message);
        const buf = new flatbuffers.ByteBuffer(data);

        if (PositionAssets.Code.Remote.GameData.bufferHasIdentifier(buf)) {
            return this._onGameData(message);
        }

        debug("Unknown message identifier");
    }

    sendViaUdp(message) {
        return this.serverUdp.send(message);
    }

    sendViaTcp(message) {
        return this.connectionHandler.send(message);
    }

    close() {
        this.connectionHandler.close();
    }

    _onGameData(message) {
        this.playerManager.all()
            .filter(player => player.isEntered() && player.id !== this.player.id)
            .forEach(player => player.communicationHandler.sendViaUdp(message));
    }
};