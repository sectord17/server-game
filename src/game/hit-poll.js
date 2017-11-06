const debug = require('debug')('sectord17-game:hit-poll');

const MIN_RATIO = 0.5;

module.exports = exports = class HitPoll {
    /**
     * @param {int} hitId
     */
    constructor(hitId) {
        const {lifeManager, playerManager} = include('/src');

        this.hitId = hitId;

        /** @type {LifeManager} */
        this.lifeManager = lifeManager;

        /** @type {PlayerManager} */
        this.playerManager = playerManager;

        /** @type {Array.<{attacker: Player, victim: Player, damage: int}>} */
        this.votes = [];

        this.voters = {};
    }

    /**
     * @param {Player} voter
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     * @returns {boolean}
     */
    vote(voter, attacker, victim, damage) {
        if (voter.id in this.voters) {
            return false;
        }

        this.voters[voter.id] = true;
        this.votes.push({attacker, victim, damage});

        return true;
    }

    /**
     * @returns {boolean}
     */
    settle() {
        let maxOccurences = 0;
        let maxVote = null;
        let occurences = {};

        const playersCount = this.playerManager.getConnectedPlayers().length;
        const minVotesCount = Math.ceil(playersCount * MIN_RATIO);

        if (this.votes.length < minVotesCount) {
            debug(`Vote for #${this.hitId} hit failed [${this.votes.length}/${minVotesCount}]`);
            return false;
        }

        this.votes
            .map(vote => ({
                key: String(vote.attacker.id) + ',' + String(vote.victim.id) + ',' + String(vote.damage),
                vote,
            }))
            .forEach(({key, vote}) => {
                occurences[key] = 1 + (occurences[key] || 0);
                if (occurences[key] > maxOccurences) {
                    maxOccurences = occurences[key];
                    maxVote = vote;
                }
            });

        if (maxOccurences >= minVotesCount) {
            this.lifeManager.takeDamage(maxVote.attacker, maxVote.victim, maxVote.damage);
            return true;
        }

        debug(`Vote for #${this.hitId} hit failed [${maxOccurences}/${minVotesCount}]`);
        return false;
    }
};