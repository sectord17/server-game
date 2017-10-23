const GameAssets = include('/lib/flatbuffers/GameSchema_generated').Assets;
const RoomAssets = include('/lib/flatbuffers/RoomSchema_generated').Assets;
const debug = require('debug')('sectord17-game:communication-handler');

module.exports = class CommunicationHandler {
    /**
     * @param {Player} player
     * @param {ConnectionHandler} connectionHandler
     */
    constructor(player, connectionHandler) {
        const {playerManager, lobby, serverUDP} = include('/lib');

        this.playerManager = playerManager;
        this.lobby = lobby;
        this.serverUDP = serverUDP;
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

        if (RoomAssets.Code.Remote.Flat.RoomMsg.bufferHasIdentifier(buf)) {
            return this._onRoomMsg(RoomAssets.Code.Remote.Flat.RoomMsg.getRootAsRoomMsg(buf));
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
        this.serverUDP.send(this.address, this.udpPort, message);
    }

    sendViaTcp(message) {
        this.connectionHandler.send(message);
    }

    // TODO: Move below to new module
    /**
     * @param {Assets.Code.Remote.Flat.RoomMsg} roomMsg
     * @private
     */
    _onRoomMsg(roomMsg) {
        if (roomMsg.dataType() === RoomAssets.Code.Remote.Flat.RoomData.MeReady) {
            /** @type {Assets.Code.Remote.Flat.MeReady} */
            const data = roomMsg.data(new RoomAssets.Code.Remote.Flat.MeReady());

            return this.lobby.changeReady(this.player, data.isReady());
        }

        debug("Unknown roommsg data type");
    }

    /**
     * @param {Assets.Code.Remote.Flat.GameData} gameData
     * @param message
     * @private
     */
    _onGameData(gameData, message) {
        if (!this.player.isConnected()) {
            debug(`GameData message from not connected player ${this.player.getInlineDetails()}`);
            return;
        }

        if (gameData.senderId() !== this.player.id) {
            debug("Invalid player id, drop message");
            return;
        }

        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.PlayerData) {
            return this._onPlayerData(message);
        }

        return this._propagateGameDataThroughTcp(message);
    }

    _onPlayerData(message) {
        this._allPlayersBut()
            .forEach(player => player.communicationHandler.sendViaUdp(message));
    }

    _propagateGameDataThroughTcp(message) {
        this._allPlayersBut()
            .forEach(player => player.communicationHandler.sendViaTcp(message));
    }

    _allPlayersBut() {
        return this.playerManager
            .allConnected()
            .filter(player => player.isConnected() && player.id !== this.player.id)
    }
};