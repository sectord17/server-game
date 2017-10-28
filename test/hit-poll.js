const {createPlayer} = require('../test-setup');
const assert = require('assert');
const {shootManager, lifeManager} = require('../lib');

describe('Hit poll', function () {
    before(require('../test-setup').before);
    afterEach(require('../test-setup').afterEach);

    it('takes damage when 2 out of 3 players vote the same and 1 something else', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2]) => {
                shootManager.voteForHit(1, connection1.player, connection2.player, 10);
                shootManager.voteForHit(1, connection1.player, connection2.player, 10);
                shootManager.voteForHit(1, connection1.player, connection2.player, 11);

                assert.equal(lifeManager.players.get(connection2.player.id).health, 90);
                done();
            })
            .catch(error => done(error));
    });

    it('takes damage when 2 out of 3 players vote the same', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2]) => {
                shootManager.voteForHit(2, connection1.player, connection2.player, 10);
                shootManager.voteForHit(2, connection1.player, connection2.player, 10);

                setTimeout(function () {
                    assert.equal(lifeManager.players.get(connection2.player.id).health, 90);
                    done();
                }, 30);
            })
            .catch(error => done(error));
    });

    it('does not take damage when less than 50% of player vote the same', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2]) => {
                shootManager.voteForHit(3, connection1.player, connection2.player, 10);
                shootManager.voteForHit(3, connection1.player, connection2.player, 11);
                shootManager.voteForHit(3, connection1.player, connection2.player, 12);

                assert.equal(lifeManager.players.get(connection2.player.id).health, 100);
                done();
            })
            .catch(error => done(error));
    });

    it('does not take damage when less than 50% of player vote', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2]) => {
                shootManager.voteForHit(2, connection1.player, connection2.player, 10);

                setTimeout(function () {
                    assert.equal(lifeManager.players.get(connection2.player.id).health, 100);
                    done();
                }, 30);
            })
            .catch(error => done(error));
    });
});

