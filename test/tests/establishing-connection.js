const {beforeEach, describe, it} = require('mocha');
const assert = require('assert');
const {playerManager} = require('../utils/lib');
const {createPlayer, beforeEach: setupBeforeEach} = require('../utils/helpers');

describe('Establishing connection is that', function () {
    beforeEach(setupBeforeEach);

    it('send login message', function (done) {
        const name = "Blah";

        createPlayer(name)
            .then(data => {
                const player = data.player;

                assert.equal(player.isDecided(), true);
                assert.equal(player.isAuthorized(), true);
                assert.equal(player.isConnected(), true);
                assert.equal(player.name, name);
                assert.equal(playerManager.getPlayers().length, 1);
                assert.equal(playerManager.getConnectedPlayers().length, 1);

                done();
            })
            .catch(error => done(error));
    });
});

