const {beforeEach, describe, it} = require('mocha');
const flatbuffers = require('flatbuffers').flatbuffers;
const GameAssets = require('../../src/flatbuffers/GameSchema_generated').Assets;
const assert = require('assert');
const {shootManager} = require('../utils/src');
const {createPlayer, startGame, beforeEach: setupBeforeEach} = require('../utils/helpers');
const {splitData} = require('../../src/communication/utils');

describe('Hit poll', function () {
    beforeEach(setupBeforeEach);

    it('takes damage when 2 out of 3 players vote the same and 1 something else', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connection1, connection2, connection3]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 1, attacker, victim, 10);
                shootManager.voteForHit(connection2.player, 1, attacker, victim, 10);
                shootManager.voteForHit(connection3.player, 1, attacker, victim, 11);

                connection1.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.HitAckData) {
                            assert.equal(victim.health, 90);
                            done();
                        }
                    }
                }));
            })
            .catch(error => done(error));
    });

    it('takes damage when 2 out of 3 players vote the same', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connection1, connection2]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 2, attacker, victim, 10);
                shootManager.voteForHit(connection2.player, 2, attacker, victim, 10);

                connection1.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.HitAckData) {
                            assert.equal(victim.health, 90);
                            done();
                        }
                    }
                }));
            })
            .catch(error => done(error));
    });

    it('kills victim when take 100hp or more', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connection1, connection2]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 1, attacker, victim, 100);
                shootManager.voteForHit(connection2.player, 1, attacker, victim, 100);

                connection1.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.PlayerDeathData) {
                            assert.equal(victim.isAlive(), false);
                            done();
                        }
                    }
                }));
            })
            .catch(error => done(error));
    });

    it('does not take damage when less than 50% of players vote the same', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connection1, connection2, connection3]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 3, attacker, victim, 10);
                shootManager.voteForHit(connection2.player, 3, attacker, victim, 11);
                shootManager.voteForHit(connection3.player, 3, attacker, victim, 12);

                assert.equal(victim.health, 100);
                done();
            })
            .catch(error => done(error));
    });

    it('does not take damage when less than 50% of players vote', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connection1, connection2]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 4, attacker, victim, 10);

                setTimeout(function () {
                    assert.equal(victim.health, 100);
                    done();
                }, 0);
            })
            .catch(error => done(error));
    });

    it('allows one player vote only once', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connection1, connection2]) => {
                const attacker = connection1.player;
                const victim = connection2.player;

                shootManager.voteForHit(connection1.player, 5, attacker, victim, 10);
                shootManager.voteForHit(connection1.player, 5, attacker, victim, 10);
                shootManager.voteForHit(connection1.player, 5, attacker, victim, 10);

                setTimeout(function () {
                    assert.equal(victim.health, 100);
                    done();
                }, 0);
            })
            .catch(error => done(error));
    });
});

