const winston = require('winston');
const net = require('net');
const dgram = require('dgram');
const flatbuffers = require('flatbuffers').flatbuffers;
const UdpAssets = require('../../src/flatbuffers/UdpSchema_generated').Assets;
const RoomAssets = require('../../src/flatbuffers/RoomSchema_generated').Assets;
const FlatBuffersHelper = require('../../src/flatbuffers/helper');
const {gameManager, lifeManager, lobby, playerManager, shootManager, statsManager, serverTCP, serverUDP} = require('./src');
const {prependLength, splitData} = require('../../src/communication/utils');
const Buffer = require('buffer').Buffer;

module.exports.beforeEach = function () {
    winston.level = 'warn';

    gameManager.shutdown = function () {
        //
    };

    shootManager.HIT_POLL_DURATION = 0;

    playerManager.deleteAll();

    gameManager.init();
    lifeManager.init();
    lobby.init();
    playerManager.init();
    shootManager.init();
    statsManager.init();
};

/**
 * @param {string} [name]
 * @returns {Promise.<{player: Player, clientUdp, clientTcp}>}
 */
module.exports.createPlayer = name => {
    return new Promise((resolve, reject) => {
        name = name || 'Blah';
        const player = playerManager.decide();
        const clientUdp = dgram.createSocket('udp4');
        const clientTcp = net.connect({port: serverTCP.port});
        let sendLoginMsgViaUdpTask = null;

        clientTcp.on('connect', () => {
            const message = FlatBuffersHelper.loginMsg(name, player.token);

            clientTcp.write(prependLength(message));

            const sendLoginMsgViaUdp = () => {
                clientUdp.send(Buffer.from(message), serverUDP.port, '127.0.0.1');
                sendLoginMsgViaUdpTask = setTimeout(sendLoginMsgViaUdp, 1);
            };
            sendLoginMsgViaUdpTask = setTimeout(sendLoginMsgViaUdp, 1);
        });

        clientTcp.on('data', data => splitData(data, data => {
            const message = new Uint8Array(data);
            const buf = new flatbuffers.ByteBuffer(message);

            if (UdpAssets.Code.Remote.Flat.UdpReceived.bufferHasIdentifier(buf)) {
                clearTimeout(sendLoginMsgViaUdpTask);
                sendLoginMsgViaUdpTask = null;
                return;
            }

            if (RoomAssets.Code.Remote.Flat.RoomMsg.bufferHasIdentifier(buf)) {
                const roomMsg = RoomAssets.Code.Remote.Flat.RoomMsg.getRootAsRoomMsg(buf);

                if (sendLoginMsgViaUdpTask !== null) {
                    reject(new Error("Received RoomMsg before UdpReceived"));
                    return;
                }

                if (roomMsg.dataType() === RoomAssets.Code.Remote.Flat.RoomData.RoomInfo) {
                    resolve({clientUdp, clientTcp, player});
                    return;
                }

                return;
            }

            return reject(new Error("Invalid buffer identifier"));
        }));
    });
};