const assert = require('assert');
const app = require('../lib');

const net = require('net');
const dgram = require('dgram');
const FlatBuffersHelper = require('../lib/flatbuffers/helper');

describe('Establishing connection', function () {
    afterEach(function (done) {
        app.playerManager.deleteAll();
        done();
    });

    it('establishes connection with server', function (done) {
        // given
        const player = app.playerManager.decide();
        const clientUdp = dgram.createSocket('udp4');
        const clientTcp = net.connect({port: 8000});
        const name = "Blah";
        const udpPort = clientUdp.address().port;

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
            assert.equal(player.communicationHandler.udpPort, udpPort);
            assert.equal(app.playerManager.all().length, 1);
            assert.equal(app.playerManager.allConnected().length, 1);

            done();
        }, 200);
    });
});

