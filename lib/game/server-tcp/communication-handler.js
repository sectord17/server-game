const flatbuffers = require('flatbuffers').flatbuffers;
const PositionAssets = require('../../flatbuffers/PositionSchema_generated').Assets;
const debug = require('debug')('sectord17-game:communication-handler');
const gameApp = require('../../game');

module.exports = class CommunicationHandler {
    /**
     * @param {Player} player
     * @param {string} address
     * @param {int} udpPort
     * @param {ConnectionHandler} connectionHandler
     */
    constructor(player, address, udpPort, connectionHandler) {
        this.playerManager = require('../../player-manager');
        this.player = player;
        this.address = address;
        this.udpPort = udpPort;
        this.connectionHandler = connectionHandler;
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
        return gameApp.serverUdp.send(this.address, this.udpPort, message);
    }

    sendViaTcp(message) {
        return this.connectionHandler.send(message);
    }

    close() {
        this.connectionHandler.close();
    }

    _onGameData(message) {
        this.playerManager
            .allConnected()
            .filter(player => player.isConnected() && player.id !== this.player.id)
            .forEach(player => player.communicationHandler.sendViaUdp(message));
    }
};