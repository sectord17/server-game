const debug = require('debug')('sectord17-game:stats-manager');
const FlatBuffersHelper = include('/src/flatbuffers/helper');

module.exports = exports = class StatsManager {
    constructor() {
        this.KILL_POINTS = 10;
        this.POINTS_THRESHOLD = 100;
    }

    use(dependencies) {
        /** @type {GameManager} */
        this.gameManager = dependencies.gameManager;

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

        if (player.points >= this.POINTS_THRESHOLD) {
            this.gameManager.gameFinish();
        }
    }
};