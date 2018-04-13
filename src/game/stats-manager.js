const FlatBuffersHelper = include('/src/flatbuffers/helper');
const winston = require('winston');

class StatsManager {
    constructor() {
        this.KILL_POINTS = 10;
        this.POINTS_THRESHOLD = 300;
    }

    use(dependencies) {
        /** @type {GameManager} */
        this.gameManager = dependencies.gameManager;

        /** @type {PlayerManager} */
        this.playerManager = dependencies.playerManager;

        /** @type {Sender} */
        this.sender = dependencies.sender;
    }

    /**
     * @param {Player} killer
     * @param {Player} victim
     */
    onPlayerDeath(killer, victim) {
        this._addPoints(killer, this.KILL_POINTS);

        const message = FlatBuffersHelper.gameData.pointReasons.kill(killer.id, victim.id, this.KILL_POINTS);
        this.sender.toEveryPlayerViaTCP(message);
    }

    /**
     * @param {Player} player
     * @param {int} points
     * @private
     */
    _addPoints(player, points) {
        player.setPoints(player.points + points);
        winston.log('info', `Grant ${points} points to ${player.getInlineDetails()}`);

        if (this._getTeamPoints(player.team) >= this.POINTS_THRESHOLD) {
            this.gameManager.gameFinish();
        }
    }

    _getTeamPoints(team) {
        return this.playerManager
            .getConnectedPlayers()
            .filter(player => player.team === team)
            .reduce((carry, player) => carry + player.points, 0);

    }
}

module.exports = exports = StatsManager;
