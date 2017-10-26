const debug = require('debug')('sectord17-game:hit-poll');

const MIN_RATIO = 0.5;

module.exports = exports = class HitPoll {
    /**
     * @param {int} hitId
     */
    constructor(hitId) {
        const {lifeManager, playerManager} = include('/lib');

        this.hitId = hitId;

        /** @type {LifeManager} */
        this.lifeManager = lifeManager;

        /** @type {PlayerManager} */
        this.playerManager = playerManager;

        /** @type {Array.<{attacker: Player, victim: Player, damage: int}>} */
        this.votes = [];
    }

    /**
     * @param {Player} attacker
     * @param {Player} victim
     * @param {int} damage
     */
    vote(attacker, victim, damage) {
        this.votes.push({attacker, victim, damage});
    }

    settle() {
        let maxOccurences = 0;
        let maxVote = null;
        let occurences = {};

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

        const playersCount = this.playerManager.allConnected().length;
        const minVotesCount = Math.ceil(playersCount * MIN_RATIO);

        if (maxOccurences >= minVotesCount) {
            this.lifeManager.takeDamage(maxVote.attacker, maxVote.victim, maxVote.damage);
        } else {
            debug(`Vote for #${this.hitId} hit failed [${maxOccurences}/${minVotesCount}]`);
        }
    }
};