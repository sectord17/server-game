const assert = require('assert');

const playerManager = require('../lib/player-manager');

describe('Connection to the game phases is that', function () {
    before(require('../test-setup').before);
    afterEach(require('../test-setup').afterEach);

    it('should decide to connect', function () {
        // given

        // when
        const player = playerManager.decide();

        // then
        assert.equal(player.isDecided(), true);
        assert.equal(player.isAuthorized(), false);
        assert.equal(player.isConnected(), false);
        assert.equal(playerManager.all().length, 1);
        assert.equal(playerManager.allConnected().length, 0);
    });

    it('should authorizes', function (done) {
        // given
        const name = "Foo";
        const player = playerManager.decide();

        // when
        playerManager
            .authorize(player.token, name)
            .then(player => {
                // then
                assert.equal(player.isDecided(), true);
                assert.equal(player.isAuthorized(), true);
                assert.equal(player.isConnected(), false);
                assert.equal(player.name, name);
                assert.equal(playerManager.all().length, 1);
                assert.equal(playerManager.allConnected().length, 0);
                done();
            })
            .catch(error => done(error));
    });

    it('should connects to the server', function (done) {
        // given
        const name = "Foo";
        const address = "127.0.0.1";
        const udpPort = 666;
        const player = playerManager.decide();

        // when
        playerManager
            .connect(player.token, name, address, udpPort, {
                close() {
                }
            })
            .then(player => {
                // then
                assert.equal(player.isDecided(), true);
                assert.equal(player.isAuthorized(), true);
                assert.equal(player.isConnected(), true);
                assert.equal(player.name, name);
                assert.equal(player.communicationHandler.address, address);
                assert.equal(player.communicationHandler.udpPort, udpPort);
                assert.equal(playerManager.all().length, 1);
                assert.equal(playerManager.allConnected().length, 1);
                done();
            })
            .catch(error => done(error));
    });
});

