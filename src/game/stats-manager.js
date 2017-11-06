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
        this.init();
    }

    init() {
        /** @type {Map.<int, {points: int}>} */
        this.players = new Map();
    }

    /**
     * @param {Player} killer
     * @param {Player} victim
     */
    onPlayerDeath(killer, victim) {
        this._addPoints(killer, this.KILL_POINTS);

        const message = FlatBuffersHelper.gameData.pointsChangedData(
            killer.id, this.KILL_POINTS, builder => FlatBuffersHelper.gameData.pointReasons.kill(builder, killer.id, victim.id)
        );

        this.sender.toEveryPlayerViaTCP(message);
    }

    /**
     * @param {Player} player
     * @param {int} points
     * @private
     */
    _addPoints(player, points) {
        const playerStat = this.players.get(player.id);
        playerStat.points += points;

        if (playerStat.points >= this.POINTS_THRESHOLD) {
            this.gameManager.gameFinish();
        }
    }

    /**
     * @param {Player} player
     */
    addPlayer(player) {
        if (this.players.has(player.id)) {
            debug(`Player ${player.getInlineDetails()} is in the stats-manager so cannot be added.`);
            return;
        }

        this.players.set(player.id, {
            points: 0,
        });
    }

    /**
     * @param {Player} player
     */
    removePlayer(player) {
        if (!this.players.has(player.id)) {
            debug(`Player ${player.getInlineDetails()} is not in the stats-manager so cannot be removed.`);
            return;
        }

        this.players.delete(player.id);
    }
};