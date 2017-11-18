const moment = require('moment');
const debug = require('debug')('sectord17-game:life-manager');
const FlatBuffersHelper = include('/src/flatbuffers/helper');
const FlatbufferErrors = require('../errors/flatbuffer-errors');

module.exports = exports = class LifeManager {
    constructor() {
        this.RESPAWN_COOLDOWN = 5 * 1000;
        this.MAX_HEALTH = 100;
    }

    use(dependencies) {
        /** @type {StatsManager} */
        this.statsManager = dependencies.statsManager;

        /** @type {Sender} */
        this.sender = dependencies.sender;
    }

    /**
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     */
    takeDamage(attacker, victim, damage) {
        if (!victim.isAlive() || !attacker.isAlive()) {
            return;
        }

        victim.setHealth(Math.max(0, victim.health - damage));

        const message = FlatBuffersHelper.gameData.hitAckData(victim.id, damage);
        this.sender.toEveryPlayerViaTCP(message);

        if (victim.health <= 0) {
            this.onPlayerDeath(attacker, victim);
        }
    }

    /**
     * @param {Player} player
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    spawnPlayer(player, x, y, z) {
        if (!this._canRespawn(player)) {
            const message = FlatBuffersHelper.error(FlatbufferErrors.CANNOT_RESPAWN);
            this.sender.toPlayerViaTCP(player, message);
            return;
        }

        // TODO: Position validation
        player.setHealth(this.MAX_HEALTH);

        const message = FlatBuffersHelper.gameData.playerRespawnAckData(player.id, x, y, z);
        this.sender.toEveryPlayerViaTCP(message);

        debug(`Player ${player.getInlineDetails()} has been respawned`);
    }

    _canRespawn(player) {
        return !player.isAlive() && moment() - player.diedAt >= this.RESPAWN_COOLDOWN;
    }

    /**
     * @param {Player} killer
     * @param {Player} victim
     */
    onPlayerDeath(killer, victim) {
        victim.setDiedAt(moment());

        const message = FlatBuffersHelper.gameData.playerDeathData(victim.id);
        this.sender.toEveryPlayerViaTCP(message);

        this.statsManager.onPlayerDeath(killer, victim);

        debug(`Player ${victim.getInlineDetails()} has died`);
    }
};
