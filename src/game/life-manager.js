const moment = require('moment');
const debug = require('debug')('sectord17-game:life-manager');
const FlatBuffersHelper = include('/src/flatbuffers/helper');
const ModelNotFoundError = require('../errors/model-not-found-error');
const FlatbufferErrors = require('../errors/flatbuffer-errors');

module.exports = exports = class LifeManager {
    static get RESPAWN_COOLDOWN() {
        return 5 * 1000;
    }

    static get MAX_HEALTH() {
        return 100;
    }

    /**
     * @param {Sender} sender
     * @param {StatsManager} statsManager
     */
    constructor(sender, statsManager) {
        this.sender = sender;
        this.statsManager = statsManager;
        this.init();
    }

    init() {
        /** @type {Map.<int, {health: int, deathTime: [moment]}>} */
        this.players = new Map();
    }

    /**
     * @param {int} playerId
     * @returns {int}
     * @throws ModelNotFoundError
     */
    getHealth(playerId) {
        const playerLife = this.players.get(playerId);

        if (playerLife === undefined) {
            throw new ModelNotFoundError('player-life', playerId);
        }

        return playerLife.health;
    }

    /**
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     */
    takeDamage(attacker, victim, damage) {
        const playerLife = this.players.get(victim.id);

        if (playerLife === undefined) {
            throw new ModelNotFoundError('player-life', victim.id);
        }

        playerLife.health = Math.max(0, playerLife.health - damage);

        if (playerLife.get <= 0) {
            this.onPlayerDeath(attacker, victim);
        }
    }

    /**
     * @param {Player} player
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    respawnPlayer(player, x, y, z) {
        const playerLife = this.players.get(player.id);

        if (moment() - playerLife.deathTime < LifeManager.RESPAWN_COOLDOWN) {
            const message = FlatBuffersHelper.error(FlatbufferErrors.CANNOT_RESPAWN);
            this.sender.toPlayerViaTCP(player, message);
            return;
        }

        // TODO: Position validation

        playerLife.health = LifeManager.MAX_HEALTH;

        const message = FlatBuffersHelper.gameData.playerRespawnAckData(player.id, x, y, z);
        this.sender.toEveryPlayerViaTCP(message);

        debug(`Player ${player.getInlineDetails()} has been respawned`);
    }

    /**
     * @param {Player} killer
     * @param {Player} victim
     */
    onPlayerDeath(killer, victim) {
        const playerLife = this.players.get(victim.id);
        playerLife.deathTime = moment();

        this.statsManager.onPlayerDeath(killer, victim);

        const message = FlatBuffersHelper.gameData.playerDeathData(victim.id);
        this.sender.toEveryPlayerViaTCP(message);

        debug(`Player ${victim.getInlineDetails()} has died`);
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
            health: LifeManager.MAX_HEALTH,
            deathTime: null,
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