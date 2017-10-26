const debug = require('debug')('sectord17-game:life-manager');
const FlatBuffersHelper = include('/lib/flatbuffers/helper');

const RESPAWN_COOLDOWN = 5000;
const MAX_HEALTH = 100;

module.exports = exports = class LifeManager {
    /**
     * @param {Sender} sender
     */
    constructor(sender) {
        this.sender = sender;

        /** @type {Map.<int, {health: int, deathTime: int}>} */
        this.players = new Map();
    }

    /**
     * @param {Player} player
     * @param {int} damage
     */
    takeDamage(player, damage) {
        const playerLife = this.players.get(player.id);

        playerLife.health = Math.max(0, playerLife.health - damage);

        if (playerLife.health <= 0) {
            this.onPlayerDeath(player);
        }
    }

    /**
     * @param {Player} player
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    respawnPlayer(player, x, y, z) {
        const playerLife = this.players.get(player.id);

        if (Date.now() - playerLife.deathTime < RESPAWN_COOLDOWN) {
            return false;
        }

        // TODO: Position validation

        playerLife.health = MAX_HEALTH;

        const message = FlatBuffersHelper.gameData.playerRespawnAckData(player.id, x, y, z);
        this.sender.toEveryPlayerTCP(message);

        debug(`Player ${player.getInlineDetails()} has been respawned`);

        return true;
    }

    /**
     * @param {Player} player
     */
    onPlayerDeath(player) {
        const playerLife = this.players.get(player.id);
        playerLife.deathTime = Date.now();

        const message = FlatBuffersHelper.gameData.playerDeathData(player.id);
        this.sender.toEveryPlayerTCP(message);
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
            health: 100,
            deathTime: 0,
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