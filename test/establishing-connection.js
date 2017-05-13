const assert = require('assert');
const net = require('net');
const dgram = require('dgram');
const FlatBuffersHelper = require('../lib/flatbuffers/helper');
const UdpAssets = require('../lib/flatbuffers/UdpSchema_generated').Assets;

const playerManager = require('../lib/player-manager');
const gameApp = require('../lib/game');

describe('Establishing connection is that', function () {
    before(require('../test-setup').before);
    afterEach(require('../test-setup').afterEach);

    it('send login message', function (done) {
        const name = "Blah";

        require('../test-setup')
            .createPlayer(name)
            .then(data => {
                const player = data.player;

                assert.equal(player.isDecided(), true);
                assert.equal(player.isAuthorized(), true);
                assert.equal(player.isConnected(), true);
                assert.equal(player.name, name);
                assert.equal(playerManager.all().length, 1);
                assert.equal(playerManager.allConnected().length, 1);

                done();
            })
            .catch(error => done(error));
    });
});

