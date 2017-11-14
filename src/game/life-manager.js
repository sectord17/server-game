const moment = require('moment');
const debug = require('debug')('sectord17-game:life-manager');
const FlatBuffersHelper = include('/src/flatbuffers/helper');
const ModelNotFoundError = require('../errors/model-not-found-error');
const FlatbufferErrors = require('../errors/flatbuffer-errors');

module.exports = exports = class LifeManager {
    /**
     * @param {Sender} sender
     * @param {StatsManager} statsManager
     */
    constructor(sender, statsManager) {
        this.RESPAWN_COOLDOWN = 5 * 1000;
        this.MAX_HEALTH = 100;

        this.sender = sender;
        this.statsManager = statsManager;
        this.init();
    }

    init() {
        /** @type {Map.<int, {health: int, diedAt: [moment]}>} */
        this.players = new Map();
    }

    /**
     * @param {Player} player
     * @returns {int}
     * @throws ModelNotFoundError
     */
    getHealth(player) {
        return this._getPlayerLife(player).health;
    }

    /**
     * @param {Player} player
     * @returns {moment}
     */
    getDiedAt(player) {
        return this._getPlayerLife(player).diedAt;
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    isAlive(player) {
        return this.getHealth(player) > 0;
    }

    /**
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     */
    takeDamage(attacker, victim, damage) {
        if (!this.isAlive(victim) || !this.isAlive(attacker)) {
            return;
        }

        const playerLife = this._getPlayerLife(victim);
        playerLife.health = Math.max(0, playerLife.health - damage);

        const message = FlatBuffersHelper.gameData.hitAckData(victim.id, damage);
        this.sender.toEveryPlayerViaTCP(message);

        if (playerLife.health <= 0) {
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
        const playerLife = this._getPlayerLife(player);

        if (this.isAlive(player) || moment() - playerLife.diedAt < this.RESPAWN_COOLDOWN) {
            const message = FlatBuffersHelper.error(FlatbufferErrors.CANNOT_RESPAWN);
            this.sender.toPlayerViaTCP(player, message);
            return;
        }

        // TODO: Position validation

        playerLife.health = this.MAX_HEALTH;

        const message = FlatBuffersHelper.gameData.playerRespawnAckData(player.id, x, y, z);
        this.sender.toEveryPlayerViaTCP(message);

        debug(`Player ${player.getInlineDetails()} has been respawned`);
    }

    /**
     * @param {Player} killer
     * @param {Player} victim
     */
    onPlayerDeath(killer, victim) {
        const playerLife = this._getPlayerLife(victim);
        playerLife.diedAt = moment();

        const message = FlatBuffersHelper.gameData.playerDeathData(victim.id);
        this.sender.toEveryPlayerViaTCP(message);

        this.statsManager.onPlayerDeath(killer, victim);

        debug(`Player ${victim.getInlineDetails()} has died`);
    }

    _getPlayerLife(player) {
        const playerLife = this.players.get(player.id);

        if (playerLife === undefined) {
            throw new ModelNotFoundError('player-life', player.id);
        }

        return playerLife;
    }

    /**
     * @param {Player} player
     */
    addPlayer(player) {
        if (this.players.has(player.id)) {
            debug(`Player ${player.getInlineDetails()} is in the life-manager so cannot be added.`);
            return;
        }

        this.players.set(player.id, {
            health: 0,
            diedAt: null,
        });
    }

    /**
     * @param {Player} player
     */
    removePlayer(player) {
        if (!this.players.has(player.id)) {
            debug(`Player ${player.getInlineDetails()} is not in the life-manager so cannot be removed.`);
            return;
        }

        this.players.delete(player.id);
    }
};
