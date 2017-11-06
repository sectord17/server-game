const {beforeEach, describe, it} = require('mocha');
const flatbuffers = require('flatbuffers').flatbuffers;
const {createPlayer, startGame, beforeEach: setupBeforeEach} = require('../utils/helpers');
const {prependLength, splitData} = require('../../src/communication/utils');
const Player = require('../../src/game/player');
const ErrorAssets = require('../../src/flatbuffers/ErrorSchema_generated').Assets;
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

                connections1.clientTcp.on('data', data => splitData(data, data => {
                    const message = new Uint8Array(data);
                    const buf = new flatbuffers.ByteBuffer(message);

                    if (ErrorAssets.Code.Remote.Flat.ErrorMessage.bufferHasIdentifier(buf)) {
                        done();
                    }
                }));

                connections1.clientTcp.write(buffer);
            });
    });
});

