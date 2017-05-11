const assert = require('assert');
const app = require('../lib');

describe('Connection phases', function () {
    afterEach(function (done) {
        app.playerManager.deleteAll();
        done();
    });

    it('can decide to connect', function (done) {
        // given

        // when
        const player = app.playerManager.decide();

        // then
        assert.equal(player.isDecided(), true);
        assert.equal(player.isAuthorized(), false);
        assert.equal(player.isConnected(), false);
        assert.equal(app.playerManager.all().length, 1);
        assert.equal(app.playerManager.allConnected().length, 0);
    });

    it('authorizes', function (done) {
        // given
        const name = "Foo";
        const player = app.playerManager.decide();

        // when
        app.playerManager
            .authorize(player.token, name)
            .then(player => {
                // then
                assert.equal(player.isDecided(), true);
                assert.equal(player.isAuthorized(), false);
                assert.equal(player.isConnected(), false);
                assert.equal(player.name, name);
                assert.equal(app.playerManager.all().length, 1);
                assert.equal(app.playerManager.allConnected().length, 0);
                done();
            });
    });

    it('connects to the server', function (done) {
        // given
        const name = "Foo";
        const address = "127.0.0.1";
        const udpPort = 666;
        const player = app.playerManager.decide();

        // when
        app.playerManager
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
                assert.equal(app.playerManager.all().length, 1);
                assert.equal(app.playerManager.allConnected().length, 1);
                done();
            });
    });
});

