const moment = require('moment');
const assert = require('assert');
const {beforeEach, describe, it} = require('mocha');
const {createPlayer, startGame, beforeEach: setupBeforeEach} = require('../utils/helpers');
const {supervisor, playerManager} = require('../../src');

describe('Checking for idle players', function () {
    beforeEach(setupBeforeEach);

    it('disconnects player when he is idle for a long time', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connections1]) => {
                connections1.player.lastActiveAt = moment().subtract(1, 'minute');
                supervisor.disconnectIdlePlayers();

                assert.equal(playerManager.getConnectedPlayers().length, 1);
                done();
            })
            .catch(error => done(error));
    });

    it('does not disconnect anyone if they are not idle for a long time', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connections1]) => {
                connections1.player.lastActiveAt = moment().subtract(40, 'seconds');
                supervisor.disconnectIdlePlayers();

                assert.equal(playerManager.getConnectedPlayers().length, 2);
                done();
            })
            .catch(error => done(error));
    });
});