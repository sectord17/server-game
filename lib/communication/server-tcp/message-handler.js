const GameAssets = include('/lib/flatbuffers/GameSchema_generated').Assets;
const RoomAssets = include('/lib/flatbuffers/RoomSchema_generated').Assets;
const debug = require('debug')('sectord17-game:message-handler');

module.exports = exports = class MessageHandler {
    /**
     * @param {Player} player
     */
    constructor(player) {
        const {playerManager, lobby, sender, lifeManager} = include('/lib');

        /** @type {PlayerManager} */
        this.playerManager = playerManager;

        /** @type {LifeManager} */
        this.lifeManager = lifeManager;

        /** @type {Lobby} */
        this.lobby = lobby;

        /** @type {Sender} */
        this.sender = sender;

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

        const senderId = gameData.senderId();

        if (senderId !== this.player.id) {
            debug("Invalid player id, drop message");
            return;
        }

        const dataType = gameData.dataType();

        if (dataType === GameAssets.Code.Remote.Flat.Data.PlayerData) {
            return this._onPlayerData(message);
        }

        if (dataType === GameAssets.Code.Remote.Flat.Data.PlayerRespawnReqData) {
            return this._onPlayerRespawnReqData(data);
        }

        if (dataType === GameAssets.Code.Remote.Flat.Data.HitReqData) {
            return this._onHitReqData(data);
        }

        return this.sender.toEveryPlayerButTCP(this.player, message);
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
        this.lobby.changeTeam(this.player, data.team());
    }

    _onPlayerData(message) {
        this.sender.toEveryPlayerButUDP(this.player, message);
    }

    /**
     * @param {Assets.Code.Remote.Flat.PlayerRespawnReqData} data
     */
    _onPlayerRespawnReqData(data) {
        const position = data.position();
        this.lifeManager.respawnPlayer(this.player, position.x, position.y, position.z);
    }

    /**
     * @param {Assets.Code.Remote.Flat.HitReqData} data
     */
    _onHitReqData(data) {
        const attacker = this.playerManager.getConnectedPlayer(data.attackerId());
        const victim = this.playerManager.getConnectedPlayer(data.targetId());

        if (attacker === undefined || victim === undefined) {
            return;
        }

        // TODO: Limit to one vote per client per hit
        this.lifeManager.voteForHit(data.hitId(), attacker, victim, data.damage());
    }
};