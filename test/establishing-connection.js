const assert = require('assert');
const net = require('net');
const dgram = require('dgram');
const FlatBuffersHelper = require('../lib/flatbuffers/helper');

const playerManager = require('../lib/player-manager');

describe('Establishing connection is that', function () {
    afterEach(function (done) {
        playerManager.deleteAll();
        done();
    });

    it('send login message after getting connected via TCP and UDP', function (done) {
        // given
        const player = playerManager.decide();
        const clientUdp = dgram.createSocket('udp4');
        const clientTcp = net.connect({port: 8000});
        const name = "Blah";
        let udpPort = null;
        clientUdp.bind(0, () => {
            udpPort = clientUdp.address().port;
        });

        // when
        clientTcp.on('connect', () => {
            clientTcp.write(FlatBuffersHelper.loginMsg(name, player.token, udpPort));
        });

        // then
        // TODO: Change it to listening on acceptance message
        setTimeout(() => {
            assert.equal(player.isDecided(), true);
            assert.equal(player.isAuthorized(), true);
            assert.equal(player.isConnected(), true);
            assert.equal(player.name, name);
            // assert.equal(player.communicationHandler.udpPort, udpPort);
            assert.equal(playerManager.all().length, 1);
            assert.equal(playerManager.allConnected().length, 1);

            done();
        }, 50);
    });
});

