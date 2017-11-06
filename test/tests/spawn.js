const {beforeEach, describe, it} = require('mocha');
const flatbuffers = require('flatbuffers').flatbuffers;
const {createPlayer, startGame, beforeEach: setupBeforeEach} = require('../utils/helpers');
const {prependLength, splitData} = require('../../src/communication/utils');
const Player = require('../../src/game/player');
const RoomAssets = require('../../src/flatbuffers/RoomSchema_generated').Assets;
const ErrorAssets = require('../../src/flatbuffers/ErrorSchema_generated').Assets;
const FlatBuffersHelper = require('../../src/flatbuffers/helper');

// describe('Game is in progress and', function () {
//     beforeEach(setupBeforeEach);
//
//     it('spawn properly', function (done) {
//         Promise.all([createPlayer(), createPlayer()])
//             .then(startGame)
//             .catch(error => done(error));
//     });
// });

