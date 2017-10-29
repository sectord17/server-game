const HitPoll = require('./hit-poll');

const HIT_POLL_DURATION = 50;

module.exports = exports = class ShootManager {
    /**
     * @param {PlayerManager} playerManager
     */
    constructor(playerManager) {
        this.playerManager = playerManager;
        this.init();
    }

    init() {
        /** @type {Map.<int, HitPoll>} */
        this.hitPolls = new Map();

        /** @type {Map.<int, Object>} */
        this.timeouts = new Map();
    }

    /**
     * @param {Player} voter
     * @param {int} hitId
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     */
    voteForHit(voter, hitId, attacker, victim, damage) {
        const hitPoll = this._getOrCreateHitPoll(hitId);
        hitPoll.vote(voter, attacker, victim, damage);

        if (hitPoll.votes.length >= this.playerManager.getConnectedPlayers().length) {
            this._endPoll(hitPoll);
        }
    }

    /**
     * @param {int} hitId
     * @returns {HitPoll}
     * @private
     */
    _getOrCreateHitPoll(hitId) {
        const hitPoll = this.hitPolls.get(hitId);
        if (hitPoll) {
            return hitPoll;
        }

        return this._createPoll(hitId);
    }

    /**
     * @param {int} hitId
     * @returns {HitPoll}
     * @private
     */
    _createPoll(hitId) {
        const hitPoll = new HitPoll(hitId);
        const timeout = setTimeout(() => this._endPoll(hitPoll), HIT_POLL_DURATION);

        this.hitPolls.set(hitId, hitPoll);
        this.timeouts.set(hitId, timeout);

        return hitPoll;
    }

    /**
     * @param {HitPoll} hitPoll
     * @private
     */
    _endPoll(hitPoll) {
        hitPoll.settle();

        const timeout = this.timeouts.get(hitPoll.hitId);
        if (timeout) {
            clearTimeout(timeout);
        }

        this.hitPolls.delete(hitPoll.hitId);
        this.timeouts.delete(hitPoll.hitId);
    }
};
