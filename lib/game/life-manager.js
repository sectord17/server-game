const debug = require('debug')('sectord17-game:life-manager');
const FlatBuffersHelper = include('/lib/flatbuffers/helper');
const HitPoll = require('./hit-poll');
const OldPollError = require('../errors/old-poll-error');

const RESPAWN_COOLDOWN = 5000;
const MAX_HEALTH = 100;
const HIT_POLL_DURATION = 30;

module.exports = exports = class LifeManager {
    /**
     * @param {Sender} sender
     * @param {StatsManager} statsManager
     */
    constructor(sender, statsManager) {
        this.sender = sender;
        this.statsManager = statsManager;

        /** @type {Map.<int, {health: int, deathTime: int}>} */
        this.players = new Map();

        /**
         * @type {Map.<int, HitPoll>}
         */
        this.hitPolls = new Map();
    }

    /**
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     */
    takeDamage(attacker, victim, damage) {
        const playerLife = this.players.get(victim.id);

        playerLife.health = Math.max(0, playerLife.health - damage);

        if (playerLife.health <= 0) {
            this.onPlayerDeath(attacker, victim);
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
     * @param {Player} killer
     * @param {Player} victim
     */
    onPlayerDeath(killer, victim) {
        const playerLife = this.players.get(victim.id);
        playerLife.deathTime = Date.now();

        this.statsManager.onPlayerDeath(killer, victim);

        const message = FlatBuffersHelper.gameData.playerDeathData(victim.id);
        this.sender.toEveryPlayerTCP(message);

        debug(`Player ${victim.getInlineDetails()} has died`);
    }

    /**
     * @param {int} hitId
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     */
    voteForHit(hitId, attacker, victim, damage) {
        this._getOrCreateHitPoll(hitId)
            .then(hitPoll => hitPoll.vote(attacker, victim, damage))
            .catch(error => {
                //
            });
    }

    /**
     * @param {int} hitId
     * @returns {Promise.<HitPoll>}
     * @private
     */
    _getOrCreateHitPoll(hitId) {
        return new Promise((resolve, reject) => {
            let hitPoll = this.hitPolls.get(hitId);

            if (hitPoll instanceof HitPoll) {
                resolve(hitPoll);
                return;
            }

            if (hitPoll === null) {
                reject(new OldPollError());
                return;
            }

            hitPoll = new HitPoll(hitId);
            this.hitPolls.set(hitId, hitPoll);

            setTimeout(() => {
                this.hitPolls.set(hitId, null);
                hitPoll.settle();
            }, HIT_POLL_DURATION);

            resolve(hitPoll);
        });
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