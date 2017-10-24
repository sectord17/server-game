const FlatBuffersHelper = include('/lib/flatbuffers/helper');
const debug = require('debug')('sectord17-game:lobby');
const winston = require('winston');

const MIN_PLAYERS_TO_START_GAME = 2;

module.exports = exports = class Lobby {
    constructor() {
        /** @type {GameManager} */
        this.gameManager = null;

        /** @type {PlayerManager} */
        this.playerManager = null;

        /** @type {Map<int, {ready: boolean}>} */
        this.playersDetails = new Map();
    }

    use(dependencies) {
        this.gameManager = dependencies.gameManager;
        this.playerManager = dependencies.playerManager;
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    inLobby(player) {
        return this.playersDetails.has(player.id);
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    join(player) {
        if (!player.isConnected()) {
            debug(`Player ${player.getInlineDetails()} is not connected so cannot join.`);
            return false;
        }

        if (this.inLobby(player)) {
            debug(`Player ${player.getInlineDetails()} is in the lobby so cannot join again.`);
            return false;
        }

        this.playersDetails.set(player.id, {ready: false});

        this._sendRoomInfo(player);
        this._informPlayersPlayerJoined(player);

        debug(`Player ${player.getInlineDetails()} joined the lobby.`);

        return true;
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    quit(player) {
        if (!this.inLobby(player)) {
            debug(`Player ${player.getInlineDetails()} is not in the lobby so cannot quit.`);
            return false;
        }

        this.playersDetails.delete(player.id);
        this._informPlayersPlayerQuit(player);

        debug(`Player ${player.getInlineDetails()} quit the lobby.`);

        return true;
    }

    /**
     * @param {Player} player
     * @param {boolean} ready
     * @returns {boolean}
     */
    changeReady(player, ready) {
        if (!this.inLobby(player)) {
            debug(`Player ${player.getInlineDetails()} is not in the lobby so cannot change ready.`);
            return false;
        }

        this.playersDetails.get(player.id).ready = ready;
        this._informPlayersPlayerChangedReadyState(player, ready);

        if (ready) {
            debug(`Player ${player.getInlineDetails()} is ready for game start.`);
        } else {
            debug(`Player ${player.getInlineDetails()} is unready for game start.`);
        }

        // Player changed ready state, but game could be already in starting state
        // That is why we should make sure it is now in preparing state
        this.gameManager.gamePreparing();
        this._tryStartGame();

        return true;
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    isReady(player) {
        if (!this.inLobby(player)) {
            return false;
        }

        return this.playersDetails.get(player.id).ready;
    }

    _tryStartGame() {
        const playersDetails = Array.from(this.playersDetails.values());

        if (this.playerManager.allConnected() < MIN_PLAYERS_TO_START_GAME) {
            return false;
        }

        if (!playersDetails.every(playerInfo => playerInfo.ready)) {
            return false;
        }

        winston.log('info', "Game started!");

        this.gameManager.gameStarting();

        return true;
    }

    /**
     * Send player details about connected players
     *
     * @param {Player} player
     * @private
     */
    _sendRoomInfo(player) {
        const message = FlatBuffersHelper.roomMsg.roomInfo(this.playerManager.allConnected());

        player.communicationHandler.sendViaTcp(message);
    }

    /**
     * Inform all players on the server that new player joined the server
     *
     * @param {Player} player
     * @private
     */
    _informPlayersPlayerJoined(player) {
        const message = FlatBuffersHelper.roomMsg.playerConnected(player.id, player.name);

        this._allPlayersBut(player)
            .forEach(playerReceiver => playerReceiver.communicationHandler.sendViaTcp(message));
    }

    /**
     * Inform all players on the server that player quit the server
     *
     * @param {Player} player
     * @private
     */
    _informPlayersPlayerQuit(player) {
        const message = FlatBuffersHelper.roomMsg.playerDisconnected(player.id);

        this._allPlayersBut(player)
            .forEach(playerReceiver => playerReceiver.communicationHandler.sendViaTcp(message));
    }

    /**
     * Inform all players on the server that player changed its ready state
     *
     * @param {Player} player
     * @param {boolean} ready
     * @private
     */
    _informPlayersPlayerChangedReadyState(player, ready) {
        const message = FlatBuffersHelper.roomMsg.playerReady(player.id, ready);

        this._allPlayersBut(player)
            .forEach(playerReceiver => playerReceiver.communicationHandler.sendViaTcp(message));
    }

    /**
     * @param {Player} player
     * @returns {Array.<Player>}
     * @private
     */
    _allPlayersBut(player) {
        return this.playerManager
            .allConnected()
            .filter(playerCompared => playerCompared.id !== player.id);
    }
};
