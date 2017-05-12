const flatbuffers = require('flatbuffers').flatbuffers;
const GameAssets = require('../../flatbuffers/GameSchema_generated').Assets;
const debug = require('debug')('sectord17-game:communication-handler');

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
        this.gameApp = require('../../game');
    }

    onTcpMessage(message, buf) {
        if (GameAssets.Code.Remote.GameData.bufferHasIdentifier(buf)) {
            return this._onGameData(GameAssets.Code.Remote.GameData.getRootAsGameData(buf), message);
        }

        debug("Unknown message identifier via TCP");
    }

    onUdpMessage(message) {
        const data = new Uint8Array(message);
        const buf = new flatbuffers.ByteBuffer(data);

        if (GameAssets.Code.Remote.GameData.bufferHasIdentifier(buf)) {
            return this._onGameData(GameAssets.Code.Remote.GameData.getRootAsGameData(buf), message);
        }

        debug("Unknown message identifier via UDP");
    }

    sendViaUdp(message) {
        return this.gameApp.serverUdp.send(this.address, this.udpPort, message);
    }

    sendViaTcp(message) {
        return this.connectionHandler.send(message);
    }

    close() {
        this.connectionHandler.close();
    }

    /**
     * @param {Assets.Code.Remote.GameData} gameData
     * @param message
     * @private
     */
    _onGameData(gameData, message) {
        if (gameData.dataType() === GameAssets.Code.Remote.Data.PlayerData) {
            return this._onPlayerData(message);
        }

        if (gameData.dataType() === GameAssets.Code.Remote.Data.ShootData) {
            return this._onShootData(message);
        }

        debug("Unknown game data data type");
    }

    _onPlayerData(message) {
        this._allPlayers()
            .forEach(player => {
                player.communicationHandler.sendViaUdp(message)
            });
    }

    _onShootData(message) {
        this._allPlayers()
            .forEach(player => player.communicationHandler.sendViaTcp(message));
    }

    _allPlayers() {
        return this.playerManager
            .allConnected()
            .filter(player => player.isConnected() && player.id !== this.player.id)
    }
};