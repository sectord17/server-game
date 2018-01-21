const assert = require('assert');
const {beforeEach, describe, it} = require('mocha');
const flatbuffers = require('flatbuffers').flatbuffers;
const RoomAssets = require('../../src/flatbuffers/RoomSchema_generated').Assets;
const GameAssets = require('../../src/flatbuffers/GameSchema_generated').Assets;
const {createPlayer, startGame, beforeEach: setupBeforeEach} = require('../utils/helpers');
const {statsManager} = require('../../src');
const {splitData} = require('../../src/communication/utils');

describe('Statistics on server', function () {
    beforeEach(setupBeforeEach);

    it('grants killer with 10 points', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connections1, connections2]) => {
                statsManager.onPlayerDeath(connections1.player, connections2.player);

                connections1.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                        const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                        if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.PointsChangedData) {
                            const pointsChanged = gameData.data(new GameAssets.Code.Remote.Flat.PointsChangedData());
                            assert.equal(pointsChanged.points(), 10);
                            assert.equal(pointsChanged.reasonType(), GameAssets.Code.Remote.Flat.Reason.KillReason);

                            const reason = pointsChanged.reason(new GameAssets.Code.Remote.Flat.KillReason());
                            assert.equal(reason.killerId(), connections1.player.id);
                            assert.equal(reason.targetId(), connections2.player.id);

                            done();
                        }
                    }
                }));
            })
            .catch(error => done(error));
    });

    it('game ends when player gains 100 points', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(startGame)
            .then(([connections1, connections2]) => {
                statsManager.onPlayerDeath(connections1.player, connections2.player);
                statsManager.onPlayerDeath(connections1.player, connections2.player);
                statsManager.onPlayerDeath(connections1.player, connections2.player);
                statsManager.onPlayerDeath(connections1.player, connections2.player);
                statsManager.onPlayerDeath(connections1.player, connections2.player);
                statsManager.onPlayerDeath(connections1.player, connections2.player);
                statsManager.onPlayerDeath(connections1.player, connections2.player);
                statsManager.onPlayerDeath(connections1.player, connections2.player);
                statsManager.onPlayerDeath(connections1.player, connections2.player);
                statsManager.onPlayerDeath(connections2.player, connections1.player);
                statsManager.onPlayerDeath(connections1.player, connections2.player);

                connections1.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (RoomAssets.Code.Remote.Flat.RoomMsg.bufferHasIdentifier(buf)) {
                        const roomMsg = RoomAssets.Code.Remote.Flat.RoomMsg.getRootAsRoomMsg(buf);
                        if (roomMsg.dataType() === RoomAssets.Code.Remote.Flat.RoomData.GameStatusChanged) {
                            const gameStatusChanged = roomMsg.data(new RoomAssets.Code.Remote.Flat.GameStatusChanged());
                            if (gameStatusChanged.status() === RoomAssets.Code.Remote.Flat.GameStatus.Finish) {
                                done();
                            }
                        }
                    }
                }));
            })
            .catch(error => done(error));
    });
});
