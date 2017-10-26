const {createPlayer} = require('../test-setup');
const assert = require('assert');
const {lifeManager} = require('../lib');

describe('Hit poll', function () {
    before(require('../test-setup').before);
    afterEach(require('../test-setup').afterEach);

    it('takes damage when 2 out of 3 players vote the same', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2]) => {
                lifeManager.voteForHit(1, connection1.player, connection2.player, 10);
                lifeManager.voteForHit(1, connection1.player, connection2.player, 10);
                lifeManager.voteForHit(1, connection1.player, connection2.player, 11);

                setTimeout(function () {
                    assert.equal(lifeManager.players.get(connection2.player.id).health, 90);
                    done();
                }, 30);
            })
            .catch(error => done(error));
    });
});

