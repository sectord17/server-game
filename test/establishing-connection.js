const assert = require('assert');
const net = require('net');
const dgram = require('dgram');
const FlatBuffersHelper = require('../lib/flatbuffers/helper');
const ServerAssets = require('../lib/flatbuffers/ServerSchema_generated').Assets;

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
                const clientTcp = data.clientTcp;
                const clientUdp = data.clientUdp;
                const player = data.player;

                clientTcp.on('connect', () => {
                    clientTcp.write(FlatBuffersHelper.loginMsg(name, player.token));

                    clientUdp.send(
                        FlatBuffersHelper.loginMsg(name, player.token), gameApp.serverUdp.port, gameApp.serverUdp.address
                    );
                });

                clientTcp.on('data', message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (!ServerAssets.Code.Remote.LoginAck.bufferHasIdentifier(buf)) {
                        done("Invalid buffer identifier");
                    }

                    assert.equal(player.isDecided(), true);
                    assert.equal(player.isAuthorized(), true);
                    assert.equal(player.isConnected(), true);
                    assert.equal(player.name, name);
                    assert.equal(playerManager.all().length, 1);
                    assert.equal(playerManager.allConnected().length, 1);

                    done();
                });
            });
    });
});

