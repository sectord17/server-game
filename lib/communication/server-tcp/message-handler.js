const GameAssets = include('/lib/flatbuffers/GameSchema_generated').Assets;
const RoomAssets = include('/lib/flatbuffers/RoomSchema_generated').Assets;
const debug = require('debug')('sectord17-game:message-handler');

module.exports = exports = class MessageHandler {
    /**
     * @param {Player} player
     */
    constructor(player) {
        const {playerManager, lobby} = include('/lib');

        /** @type {PlayerManager} */
        this.playerManager = playerManager;

        /** @type {Lobby} */
        this.lobby = lobby;

        this.player = player;
    }

    /**
     * @param {Assets.Code.Remote.Flat.RoomMsg} roomMsg
     */
    onRoomMsg(roomMsg) {
        const dataType = roomMsg.dataType();

        if (dataType === RoomAssets.Code.Remote.Flat.RoomData.MeReady) {
            return this._onMeReady(roomMsg.data(new RoomAssets.Code.Remote.Flat.MeReady()))
        }

        if (dataType === RoomAssets.Code.Remote.Flat.RoomData.ChangeTeam) {
            return this._onChangeTeam(roomMsg.data(new RoomAssets.Code.Remote.Flat.ChangeTeam()));
        }

        debug("Unknown roommsg data type");
    }

    /**
     * @param {Assets.Code.Remote.Flat.GameData} gameData
     * @param message
     */
    onGameData(gameData, message) {
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

    /**
     * @param {Assets.Code.Remote.Flat.MeReady} data
     */
    _onMeReady(data) {
        this.lobby.changeReady(this.player, data.isReady());
    }

    /**
     * @param {Assets.Code.Remote.Flat.ChangeTeam} data
     */
    _onChangeTeam(data) {
        const result = this.lobby.changeTeam(this.player, data.team());

        if (!result) {
            // TODO: Couldnt change team, send error info
        }
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