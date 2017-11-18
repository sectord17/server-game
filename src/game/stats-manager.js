const debug = require('debug')('sectord17-game:stats-manager');
const FlatBuffersHelper = include('/src/flatbuffers/helper');

module.exports = exports = class StatsManager {
    /**
     * @param {Sender} sender
     * @param {GameManager} gameManager
     */
    constructor(sender, gameManager) {
        this.KILL_POINTS = 10;
        this.POINTS_THRESHOLD = 100;

        this.sender = sender;
        this.gameManager = gameManager;
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

        if (player.points >= this.POINTS_THRESHOLD) {
            this.gameManager.gameFinish();
        }
    }
};