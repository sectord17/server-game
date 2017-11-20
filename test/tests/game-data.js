const assert = require('assert');
const {beforeEach, describe, it} = require('mocha');
const {serverUDP} = require('../utils/src');
const {createPlayer, beforeEach: setupBeforeEach, startGame} = require('../utils/helpers');
const flatbuffers = require('flatbuffers').flatbuffers;
const GameAssets = require('../../src/flatbuffers/GameSchema_generated').Assets;
const FlatBuffersHelper = require('../../src/flatbuffers/helper');
const {prependLength, splitData} = require('../../src/communication/utils');

describe('Player is on server', function () {
    beforeEach(setupBeforeEach);

    it('sends player data', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connections1, connections2]) => {
                connections1.clientUdp.on('message', message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (!GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        return done("Invalid buffer identifier");
                    }

                    const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                    assert.equal(gameData.dataType(), GameAssets.Code.Remote.Flat.Data.PlayerData);
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
            .then(startGame)
            .then(([connections1, connections2]) => {
                connections1.clientTcp.on('data', data => splitData(data, message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.ShootData) {
                            done();
                        }
                    }
                }));

                const message = FlatBuffersHelper.gameData.shootData(connections2.player.id);
                connections2.clientTcp.write(prependLength(message));
            })
            .catch(error => done(error));
    });
});

