const flatbuffers = require('flatbuffers').flatbuffers;
const RoomAssets = require('../lib/flatbuffers/RoomSchema_generated').Assets;
const FlatBuffersHelper = require('../lib/flatbuffers/helper');
const {createPlayer} = require('../test-setup');

require('../lib');

describe('Player is in the lobby and', function () {
    before(require('../test-setup').before);
    afterEach(require('../test-setup').afterEach);

    it('sends meready and game starts', function (done) {
        Promise.all([createPlayer(), createPlayer()])
            .then(([connections1, connections2]) => {
                connections2.clientTcp.on('data', message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (RoomAssets.Code.Remote.Flat.RoomMsg.bufferHasIdentifier(buf)) {
                        const roomMsg = RoomAssets.Code.Remote.Flat.RoomMsg.getRootAsRoomMsg(buf);
                        if (roomMsg.dataType() === RoomAssets.Code.Remote.Flat.RoomData.GameStatusChanged) {
                            done();
                        }
                    }
                });

                connections1.clientTcp.write(FlatBuffersHelper.roomMsg.meReady(true));
                connections2.clientTcp.write(FlatBuffersHelper.roomMsg.meReady(true));
            })
            .catch(error => done(error));
    });
});

