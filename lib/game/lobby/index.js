const FlatBuffersHelper = require('../../flatbuffers/helper');
const debug = require('debug')('sectord17-game:lobby');

class Lobby {
    constructor() {
        /**
         * @type {Map<int, {player: Player, ready: boolean}>}
         */
        this.players = new Map();
    }

    all() {
        return Array.from(this.players.values());
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    inLobby(player) {
        return this.players.has(player.id);
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

        this.players.set(player.id, {
            player: player,
            ready: false,
        });

        this._sendRoomInfo(player);
        this._informAboutJoinedMember(player);

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

        this.players.delete(player.id);
        this._informAboutQuitteddMember(player);

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

        this.players.get(player.id).ready = ready;
        this._informAboutChangeReady(player, ready);

        if (ready) {
            debug(`Player ${player.getInlineDetails()} is ready for game start.`);
        } else {
            debug(`Player ${player.getInlineDetails()} is unready for game start.`);
        }

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

        return this.players.get(player.id).ready;
    }

    _sendRoomInfo(player) {
        player.communicationHandler.sendViaTcp(FlatBuffersHelper.roomMsg.roomInfo(this.all()));
    }

    /**
     * @param {Player} player
     * @private
     */
    _informAboutJoinedMember(player) {
        const message = FlatBuffersHelper.roomMsg.playerConnected(player.id);

        this._allPlayersBut(player)
            .forEach(player2 => player2.communicationHandler.sendViaTcp(message));
    }

    /**
     * @param {Player} player
     * @private
     */
    _informAboutQuitteddMember(player) {
        const message = FlatBuffersHelper.roomMsg.playerDisconnected(player.id);

        this._allPlayersBut(player)
            .forEach(player2 => player2.communicationHandler.sendViaTcp(message));
    }

    /**
     * @param {Player} player
     * @param {boolean} ready
     * @private
     */
    _informAboutChangeReady(player, ready) {
        const message = FlatBuffersHelper.roomMsg.playerReady(player.id, ready);

        this._allPlayersBut(player)
            .forEach(player2 => player2.communicationHandler.sendViaTcp(message));
    }

    /**
     * @param {Player} player
     * @returns {Array.<Player>}
     * @private
     */
    _allPlayersBut(player) {
        return this.all()
            .map(playerInfo => playerInfo.player)
            .filter(player2 => player2.id !== player.id);
    }
}

module.exports = new Lobby();