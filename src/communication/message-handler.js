const GameAssets = include('/src/flatbuffers/GameSchema_generated').Assets;
const RoomAssets = include('/src/flatbuffers/RoomSchema_generated').Assets;
const Buffer = require('buffer').Buffer;
const debug = require('debug')('sectord17-game:message-handler');

class MessageHandler {
    /**
     * @param {Player} player
     */
    constructor(player) {
        const {playerManager, lifeManager, shootManager, gameManager, lobby, sender} = include('/src');

        /** @type {PlayerManager} */
        this.playerManager = playerManager;

        /** @type {LifeManager} */
        this.lifeManager = lifeManager;

        /** @type {ShootManager} */
        this.shootManager = shootManager;

        /** @type {GameManager} */
        this.gameManager = gameManager;

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

        debug(`RoomMsg with invalid data type: [${dataType}] from player ${this.player.getInlineDetails()}`);
    }

    /**
     * @param {Assets.Code.Remote.Flat.GameData} gameData
     * @param {Uint8Array} message
     */
    onGameData(gameData, message) {
        if (!this.player.isConnected()) {
            debug(`GameData message from not connected player ${this.player.getInlineDetails()}`);
            return;
        }

        const senderId = gameData.senderId();

        if (senderId !== this.player.id) {
            debug(`Invalid player id, drop message. Expected: [${this.player.id}], given: [${senderId}]`);
            return;
        }

        const dataType = gameData.dataType();

        if (dataType === GameAssets.Code.Remote.Flat.Data.PlayerData) {
            return this._onPlayerData(message);
        }

        if (dataType === GameAssets.Code.Remote.Flat.Data.PlayerRespawnReqData) {
            return this._onPlayerRespawnReqData(gameData.data(new GameAssets.Code.Remote.Flat.PlayerRespawnReqData()));
        }

        if (dataType === GameAssets.Code.Remote.Flat.Data.HitReqData) {
            return this._onHitReqData(gameData.data(new GameAssets.Code.Remote.Flat.HitReqData()));
        }

        if (dataType === GameAssets.Code.Remote.Flat.Data.ShootData) {
            return this._onShootData(message);
        }

        debug(`GameData with invalid data type: [${dataType}]. From player ${this.player.getInlineDetails()}`);
    }

    /**
     * @param {Uint8Array} message
     */
    _onShootData(message) {
        if (!this.player.isAlive()) {
            debug(`ShootData when player is not alive. From player: ${this.player.getInlineDetails()}`);
            return;
        }

        return this.sender.toEveryPlayerButOneViaTCP(this.player, Buffer.from(message));
    }

    /**
     * @param {Assets.Code.Remote.Flat.MeReady} data
     */
    _onMeReady(data) {
        if (this.gameManager.isInProgress()) {
            debug(`MeReady when game is in progress. From player: ${this.player.getInlineDetails()}`);
            return;
        }

        this.lobby.changeReady(this.player, data.isReady());
    }

    /**
     * @param {Assets.Code.Remote.Flat.ChangeTeam} data
     */
    _onChangeTeam(data) {
        if (this.gameManager.isInProgress()) {
            debug(`ChangeTeam when game is in progress. From player: ${this.player.getInlineDetails()}`);
            return;
        }

        this.lobby.changeTeam(this.player, data.team());
    }

    _onPlayerData(message) {
        if (!this.player.isAlive()) {
            // debug(`PlayerData when player is not alive. From player: ${this.player.getInlineDetails()}`);
            return;
        }

        this.sender.toEveryPlayerButOneViaUDP(this.player, Buffer.from(message));
    }

    /**
     * @param {Assets.Code.Remote.Flat.PlayerRespawnReqData} data
     */
    _onPlayerRespawnReqData(data) {
        if (this.player.isAlive()) {
            // debug(`PlayerRespawnReqData when player is alive. From player: ${this.player.getInlineDetails()}`);
            return;
        }

        const position = data.position();
        this.lifeManager.spawnPlayer(this.player, position.x(), position.y(), position.z());
    }

    /**
     * @param {Assets.Code.Remote.Flat.HitReqData} data
     */
    _onHitReqData(data) {
        const attacker = this.playerManager.getConnectedPlayer(data.attackerId());
        const victim = this.playerManager.getConnectedPlayer(data.targetId());

        if (attacker === undefined || victim === undefined) {
            debug(`Attacker or victim does not exist in HitReqData. From player: ${this.player.getInlineDetails()}`);
            return;
        }

        this.shootManager.voteForHit(this.player, data.hitId(), attacker, victim, data.damage());
    }
}

module.exports = exports = MessageHandler;
