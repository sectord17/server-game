const {beforeEach, describe, it} = require('mocha');
const flatbuffers = require('flatbuffers').flatbuffers;
const {playerManager} = require('../utils/src');
const {createPlayer, startGame, beforeEach: setupBeforeEach} = require('../utils/helpers');
const {prependLength, splitData} = require('../../src/communication/utils');
const Player = require('../../src/game/player');
const ErrorAssets = require('../../src/flatbuffers/ErrorSchema_generated').Assets;
const RoomAssets = require('../../src/flatbuffers/RoomSchema_generated').Assets;
const FlatBuffersHelper = require('../../src/flatbuffers/helper');

describe('Player is in the lobby and', function () {
    beforeEach(setupBeforeEach);

    it('sends meready and game starts', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(startGame)
            .then(() => done())
            .catch(error => done(error));
    });

    it('cannot change team when there are more or equal players in opposite team', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(([connections1]) => {
                const newTeam = connections1.player.team === Player.TEAM_BLUE ? Player.TEAM_RED : Player.TEAM_BLUE;
                const message = FlatBuffersHelper.roomMsg.changeTeam(connections1.player.id, newTeam);
                const buffer = prependLength(message);
                connections1.clientTcp.write(buffer);

                connections1.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (ErrorAssets.Code.Remote.Flat.ErrorMessage.bufferHasIdentifier(buf)) {
                        done();
                    }
                }));
            })
            .catch(error => done(error));
    });

    it('can change team when there are less players in opposite team', function (done) {
        Promise.all([createPlayer(), createPlayer(), createPlayer()])
            .then(([connections1, connections2, connections3]) => {
                const newTeam = connections3.player.team === Player.TEAM_BLUE ? Player.TEAM_RED : Player.TEAM_BLUE;

                if (connections1.player.team === newTeam) {
                    playerManager.disconnect(connections1.player);
                }

                if (connections2.player.team === newTeam) {
                    playerManager.disconnect(connections2.player);
                }

                const message = FlatBuffersHelper.roomMsg.changeTeam(connections3.player.id, newTeam);
                const buffer = prependLength(message);
                connections3.clientTcp.write(buffer);

                connections3.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (RoomAssets.Code.Remote.Flat.RoomMsg.bufferHasIdentifier(buf)) {
                        const roomMsg = RoomAssets.Code.Remote.Flat.RoomMsg.getRootAsRoomMsg(buf);
                        if (roomMsg.dataType() === RoomAssets.Code.Remote.Flat.RoomData.TeamChanged) {
                            done();
                        }
                    }
                }));
            })
            .catch(error => done(error));
    });
});

