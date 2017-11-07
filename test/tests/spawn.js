const moment = require('moment');
const {beforeEach, describe, it} = require('mocha');
const flatbuffers = require('flatbuffers').flatbuffers;
const {createPlayer, startGame, beforeEach: setupBeforeEach} = require('../utils/helpers');
const {lifeManager} = require('../../src');
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
                const message = FlatBuffersHelper.gameData.playerRespawnReqData(1, 1, 1, connection1.player.id);
                connection1.clientTcp.write(prependLength(message));

                connection2.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.PlayerRespawnAckData) {
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
                lifeManager.players.get(connection1.player.id).diedAt = moment();

                const message = FlatBuffersHelper.gameData.playerRespawnReqData(1, 1, 1, connection1.player.id);
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

