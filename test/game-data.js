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
            .then(([data1, data2]) => {
                data1.clientUdp.on('message', message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (!GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        return done("Invalid buffer identifier");
                    }

                    const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                    if (gameData.dataType() !== GameAssets.Code.Remote.Flat.Data.PlayerData) {
                        return done("Invalida data type");
                    }

                    done();
                });

                data2.clientUdp.send(
                    FlatBuffersHelper.playerData(), gameApp.serverUdp.port, gameApp.serverUdp.address
                );
            })
            .catch(error => done(error));
    });

    it('sends shoot data', function (done) {
        // given
        require('../test-setup').createPlayer()
            .then(data => Promise.all([data, require('../test-setup').createPlayer()]))
            .then(([data1, data2]) => {
                data1.clientTcp.on('data', message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (!GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        return done("Invalid buffer identifier");
                    }

                    const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                    if (gameData.dataType() !== GameAssets.Code.Remote.Flat.Data.ShootData) {
                        return done("Invalida data type");
                    }

                    done();
                });

                data2.clientTcp.write(FlatBuffersHelper.shootData());
            })
            .catch(error => done(error));
    });
});

