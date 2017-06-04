const flatbuffers = require('flatbuffers').flatbuffers;
const GameAssets = require('../../flatbuffers/GameSchema_generated').Assets;
const debug = require('debug')('sectord17-game:communication-handler');

module.exports = class CommunicationHandler {
    /**
     * @param {Player} player
     * @param {ConnectionHandler} connectionHandler
     */
    constructor(player, connectionHandler) {
        this.playerManager = require('../../player-manager');
        this.gameApp = require('../../game');
        this.player = player;
        this.connectionHandler = connectionHandler;
        this.address = null;
        this.udpPort = null;
    }

    /**
     * @param {string} address
     * @param {int} udpPort
     */
    assignAddress(address, udpPort) {
        this.address = address;
        this.udpPort = udpPort;
    }

    close() {
        this.connectionHandler.close();
    }

    onTcpMessage(message, buf) {
        if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
            return this._onGameData(GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf), message);
        }

        debug("Unknown message identifier via TCP");
    }

    onUdpMessage(message, buf) {
        if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
            return this._onGameData(GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf), message);
        }

        debug("Unknown message identifier via UDP");
    }

    sendViaUdp(message) {
        return this.gameApp.serverUdp.send(this.address, this.udpPort, message);
    }

    sendViaTcp(message) {
        return this.connectionHandler.send(message);
    }

    /**
     * @param {Assets.Code.Remote.Flat.GameData} gameData
     * @param message
     * @private
     */
    _onGameData(gameData, message) {
        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.PlayerData) {
            return this._onPlayerData(message);
        }

        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.ShootData) {
            return this._onShootData(message);
        }

        debug("Unknown game data data type");
    }

    _onPlayerData(message) {
        this._allPlayers()
            .forEach(player => player.communicationHandler.sendViaUdp(message));
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