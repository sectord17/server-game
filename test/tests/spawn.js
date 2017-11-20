const assert = require('assert');
const moment = require('moment');
const {beforeEach, describe, it} = require('mocha');
const flatbuffers = require('flatbuffers').flatbuffers;
const {createPlayer, startGame, beforeEach: setupBeforeEach} = require('../utils/helpers');
require('../../src');
const {prependLength, splitData} = require('../../src/communication/utils');
const GameAssets = require('../../src/flatbuffers/GameSchema_generated').Assets;
const ErrorAssets = require('../../src/flatbuffers/ErrorSchema_generated').Assets;
const FlatBuffersHelper = require('../../src/flatbuffers/helper');
const FlatbufferErrors = require('../../src/errors/flatbuffer-errors');

describe('Game is in progress and', function () {
    beforeEach(setupBeforeEach);

    it('spawns properly', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connection1, connection2]) => {
                const x = 100;
                const y = -10;
                const z = 0;

                const message = FlatBuffersHelper.gameData.playerRespawnReqData(connection1.player.id, x, y, z);
                connection1.clientTcp.write(prependLength(message));

                connection2.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.PlayerRespawnAckData) {
                            const playerRespawnAck = gameData.data(new GameAssets.Code.Remote.Flat.PlayerRespawnAckData());
                            const position = playerRespawnAck.position();
                            assert.equal(position.x(), x);
                            assert.equal(position.y(), y);
                            assert.equal(position.z(), z);
                            assert.equal(playerRespawnAck.playerId(), connection1.player.id);

                            done();
                        }
                    }
                }));
            })
            .catch(error => done(error));
    });

    it('cannot spawn before cooldown', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connection1]) => {
                connection1.player.setDiedAt(moment());

                const message = FlatBuffersHelper.gameData.playerRespawnReqData(connection1.player.id, 1, 1, 1);
                connection1.clientTcp.write(prependLength(message));

                connection1.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (ErrorAssets.Code.Remote.Flat.ErrorMessage.bufferHasIdentifier(buf)) {
                        const errorMessage = ErrorAssets.Code.Remote.Flat.ErrorMessage.getRootAsErrorMessage(buf);
                        if (errorMessage.errorCode() === FlatbufferErrors.CANNOT_RESPAWN) {
                            done();
                        }
                    }
                }));
            })
            .catch(error => done(error));
    });
});

