const flatbuffers = require('flatbuffers').flatbuffers;
const RoomAssets = require('../lib/flatbuffers/RoomSchema_generated').Assets;
const FlatBuffersHelper = require('../lib/flatbuffers/helper');
const {createPlayer} = require('../test-setup');

require('../lib');

describe('Player is in the lobby and', function () {
    before(require('../test-setup').before);
    afterEach(require('../test-setup').afterEach);

    it('sends meready and game starts', function (done) {
        createPlayer()
            .then(connections => Promise.all([connections, require('../test-setup').createPlayer()]))
            .then(([data1, data2]) => {
                data2.clientTcp.on('data', message => {
                    const data = new Uint8Array(message);
                    const buf = new flatbuffers.ByteBuffer(data);

                    if (RoomAssets.Code.Remote.Flat.RoomMsg.bufferHasIdentifier(buf)) {
                        const roomMsg = RoomAssets.Code.Remote.Flat.RoomMsg.getRootAsRoomMsg(buf);
                        if (roomMsg.dataType() === RoomAssets.Code.Remote.Flat.RoomData.GameStatusChanged) {
                            done();
                        }
                    }
                });

                data1.clientTcp.write(FlatBuffersHelper.roomMsg.meReady(true));
                data2.clientTcp.write(FlatBuffersHelper.roomMsg.meReady(true));
            })
            .catch(error => done(error));
    });
});

