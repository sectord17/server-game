const {beforeEach, describe, it} = require('mocha');
const flatbuffers = require('flatbuffers').flatbuffers;
const {createPlayer, beforeEach: setupBeforeEach} = require('../utils/helpers');
const {prependLength, splitData} = require('../../lib/communication/utils');
const RoomAssets = require('../../lib/flatbuffers/RoomSchema_generated').Assets;
const FlatBuffersHelper = require('../../lib/flatbuffers/helper');

describe('Player is in the lobby and', function () {
    beforeEach(setupBeforeEach);

    it('sends meready and game starts', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(([connections1, connections2]) => {
                connections2.clientTcp.on('data', data => splitData(data, message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (RoomAssets.Code.Remote.Flat.RoomMsg.bufferHasIdentifier(buf)) {
                        const roomMsg = RoomAssets.Code.Remote.Flat.RoomMsg.getRootAsRoomMsg(buf);
                        if (roomMsg.dataType() === RoomAssets.Code.Remote.Flat.RoomData.GameStatusChanged) {
                            done();
                        }
                    }
                }));

                const message = FlatBuffersHelper.roomMsg.meReady(true);
                const buffer = prependLength(message);
                connections1.clientTcp.write(buffer);
                connections2.clientTcp.write(buffer);
            })
            .catch(error => done(error));
    });
});

