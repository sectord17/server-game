const HitPoll = require('./hit-poll');
const OldPollError = require('../errors/old-poll-error');

const HIT_POLL_DURATION = 50;

module.exports = exports = class ShootManager {
    /**
     * @param {PlayerManager} playerManager
     */
    constructor(playerManager) {
        /** @type {Map.<int, HitPoll>} */
        this.hitPolls = new Map();

        /** @type {Map.<int, Object>} */
        this.timeouts = new Map();

        this.playerManager = playerManager;
    }

    /**
     * @param {Player} voter
     * @param {int} hitId
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     */
    voteForHit(voter, hitId, attacker, victim, damage) {
        try {
            const hitPoll = this._getOrCreateHitPoll(hitId);
            hitPoll.vote(voter, attacker, victim, damage);

            if (hitPoll.votes.length >= this.playerManager.allConnected().length) {
                this._endPoll(hitPoll);
            }
        } catch (error) {
            if (error instanceof OldPollError) {
                return;
            }

            throw error;
        }
    }

    /**
     * @param {int} hitId
     * @returns {HitPoll}
     * @private
     */
    _getOrCreateHitPoll(hitId) {
        const hitPoll = this.hitPolls.get(hitId);

        if (hitPoll === null) {
            throw new OldPollError();
        }

        if (hitPoll instanceof HitPoll) {
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

        this.hitPolls.set(hitPoll.hitId, null);
        this.timeouts.set(hitPoll.hitId, null);
    }
};
