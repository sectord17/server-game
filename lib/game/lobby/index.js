const FlatBuffersHelper = require('../../flatbuffers/helper');
const debug = require('debug')('sectord17-game:lobby');

module.exports = class Lobby {
    constructor() {
        this.players = new Map();
    }

    /**
     * @param {Player} player
     */
    join(player) {
        if (!player.isConnected()) {
            throw new Error("Player has to be connected to join the lobby.");
        }

        if (this.players.has(player.id)) {
            throw new Error("Player is already in the lobby");
        }

        this.players.set(player.id, player);
        debug(`Player ${player.getInlineDetails()} joined the lobby.`);

        this._informPlayersAboutNewMember(player);
    }

    all() {
        return Array.from(this.players.values());
    }

    /**
     * @param {Player} newPlayer
     * @private
     */
    _informPlayersAboutNewMember(newPlayer) {
        this._allBut(newPlayer)
            .forEach(player => {
                const message = FlatBuffersHelper.roomMsg.playerConnected(newPlayer.id);
                player.communicationHandler.sendViaTcp(message);
            })
    }

    /**
     * @param {Player} player
     * @returns {Array.<Player>}
     * @private
     */
    _allBut(player) {
        return this.all().filter(player2 => player2.id !== player.id)
    }
};