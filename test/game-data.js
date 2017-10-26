const flatbuffers = require('flatbuffers').flatbuffers;
const GameAssets = require('../lib/flatbuffers/GameSchema_generated').Assets;
const FlatBuffersHelper = require('../lib/flatbuffers/helper');
const {createPlayer} = require('../test-setup');
const {serverUDP} = require('../lib');

describe('Player is on server', function () {
    before(require('../test-setup').before);
    afterEach(require('../test-setup').afterEach);

    it('sends player data', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(([connections1, connections2]) => {
                connections1.clientUdp.on('message', message => {
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

                connections2.clientUdp.send(
                    FlatBuffersHelper.gameData.playerData(connections2.player.id), serverUDP.port, serverUDP.address
                );
            })
            .catch(error => done(error));
    });

    it('sends shoot data', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(([connections1, connections2]) => {
                connections1.clientTcp.on('data', message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.ShootData) {
                            return done();
                        }
                    }
                });

                connections2.clientTcp.write(FlatBuffersHelper.gameData.shootData(connections2.player.id));
            })
            .catch(error => done(error));
    });
});

