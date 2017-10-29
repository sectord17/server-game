const {beforeEach, describe, it} = require('mocha');
const assert = require('assert');
const {createPlayer, beforeEach: setupBeforeEach} = require('../test-setup');
const {shootManager, lifeManager} = require('../lib');

describe('Hit poll', function () {
    beforeEach(setupBeforeEach);

    it('takes damage when 2 out of 3 players vote the same and 1 something else', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2, connection3]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 1, attacker, victim, 10);
                shootManager.voteForHit(connection2.player, 1, attacker, victim, 10);
                shootManager.voteForHit(connection3.player, 1, attacker, victim, 11);

                assert.equal(lifeManager.getHealth(victim.id), 90);
                done();
            })
            .catch(error => done(error));
    });

    it('takes damage when 2 out of 3 players vote the same', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 2, attacker, victim, 10);
                shootManager.voteForHit(connection2.player, 2, attacker, victim, 10);

                setTimeout(function () {
                    assert.equal(lifeManager.getHealth(victim.id), 90);
                    done();
                }, 50);
            })
            .catch(error => done(error));
    });

    it('does not take damage when less than 50% of player vote the same', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2, connection3]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 3, attacker, victim, 10);
                shootManager.voteForHit(connection2.player, 3, attacker, victim, 11);
                shootManager.voteForHit(connection3.player, 3, attacker, victim, 12);

                assert.equal(lifeManager.getHealth(victim.id), 100);
                done();
            })
            .catch(error => done(error));
    });

    it('does not take damage when less than 50% of player vote', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 4, attacker, victim, 10);

                setTimeout(function () {
                    assert.equal(lifeManager.getHealth(victim.id), 100);
                    done();
                }, 50);
            })
            .catch(error => done(error));
    });

    it('allows one player vote only once', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connection1, connection2]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 5, attacker, victim, 10);
                shootManager.voteForHit(connection1.player, 5, attacker, victim, 10);
                shootManager.voteForHit(connection1.player, 5, attacker, victim, 10);

                assert.equal(lifeManager.getHealth(victim.id), 100);
                done();
            })
            .catch(error => done(error));
    });
});

