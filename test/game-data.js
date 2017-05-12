const flatbuffers = require('flatbuffers').flatbuffers;
const GameAssets = require('../lib/flatbuffers/GameSchema_generated').Assets;
const gameApp = require('../lib/game');

const FlatBuffersHelper = require('../lib/flatbuffers/helper');

describe('Player is on server', function () {
    before(require('../test-setup').before);
    afterEach(require('../test-setup').afterEach);

    it('sends player data', function (done) {
        // given
        require('../test-setup').createPlayer()
            .then(connections => Promise.all([connections, require('../test-setup').createPlayer()]))
            .then(([connections1, connections2]) => {
                connections1.clientUdp.on('message', message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (GameAssets.Code.Remote.GameData.bufferHasIdentifier(buf)) {
                        return done();
                    }

                    done("Invalid buffer identifier");
                });

                connections2.clientUdp.send(
                    FlatBuffersHelper.playerData([1,1,1], [1,1,1]), gameApp.serverUdp.port, gameApp.serverUdp.address
                );
            })
            .catch(error => done(error));
    });
});

