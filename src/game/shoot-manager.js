const HitPoll = require('./hit-poll');

class ShootManager {
    constructor() {
        this.HIT_POLL_DURATION = 50;
        this.init();
    }

    init() {
        /** @type {Map.<int, HitPoll>} */
        this.hitPolls = new Map();

        /** @type {Map.<int, Object>} */
        this.timeouts = new Map();

        this.friendlyFire = false;
    }

    use(dependencies) {
        /** @type {PlayerManager} */
        this.playerManager = dependencies.playerManager;
    }

    /**
     * @param {Player} voter
     * @param {int} hitId
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     */
    voteForHit(voter, hitId, attacker, victim, damage) {
        if (!this.friendlyFire && attacker.team === victim.team) {
            return;
        }

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
        const timeout = setTimeout(() => this._endPoll(hitPoll), this.HIT_POLL_DURATION);

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
}

module.exports = exports = ShootManager;
