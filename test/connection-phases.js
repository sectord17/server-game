const {beforeEach, describe, it} = require('mocha');
const assert = require('assert');
const {beforeEach: setupBeforeEach} = require('../test-setup');
const {playerManager} = require('../lib');

describe('Connection to the game phases is that', function () {
    beforeEach(setupBeforeEach);

    it('should decide to connect', function () {
        // given

        // when
        const player = playerManager.decide();

        // then
        assert.equal(player.isDecided(), true);
        assert.equal(player.isAuthorized(), false);
        assert.equal(player.isConnected(), false);
        assert.equal(playerManager.getPlayers().length, 1);
        assert.equal(playerManager.getConnectedPlayers().length, 0);
    });

    it('should authorizes', function (done) {
        // given
        const name = "Foo";
        const player = playerManager.decide();

        // when
        playerManager
            .authorize(player.token, name, {
                close() {
                }
            })
            .then(player => {
                // then
                assert.equal(player.isDecided(), true);
                assert.equal(player.isAuthorized(), true);
                assert.equal(player.isConnected(), false);
                assert.equal(player.name, name);
                assert.equal(playerManager.getPlayers().length, 1);
                assert.equal(playerManager.getConnectedPlayers().length, 0);
                done();
            })
            .catch(error => done(error));
    });

    it('should connects to the server', function (done) {
        // given
        const name = "Foo";
        const address = "127.0.0.1";
        const udpPort = 66666;
        const player = playerManager.decide();

        // when
        playerManager
            .authorize(player.token, name, {
                close() {
                }
            })
            .then(player => playerManager.connect(player.token, address, udpPort))
            .then(player => {
                // then
                assert.equal(player.isDecided(), true);
                assert.equal(player.isAuthorized(), true);
                assert.equal(player.isConnected(), true);
                assert.equal(player.name, name);
                assert.equal(player.communicationHandler.address, address);
                assert.equal(player.communicationHandler.udpPort, udpPort);
                assert.equal(playerManager.getPlayers().length, 1);
                assert.equal(playerManager.getConnectedPlayers().length, 1);
                done();
            })
            .catch(error => done(error));
    });
});

