const winston = require('winston');
const net = require('net');
const dgram = require('dgram');
const flatbuffers = require('flatbuffers').flatbuffers;
const UdpAssets = require('../lib/flatbuffers/UdpSchema_generated').Assets;
const RoomAssets = require('../lib/flatbuffers/RoomSchema_generated').Assets;
const FlatBuffersHelper = require('../lib/flatbuffers/helper');

const playerManager = require('../lib/game/player-manager');
const serverTcp = require('../lib/communication/server-tcp');
const serverUdp = require('../lib/communication/server-udp');

module.exports.afterEach = function () {
    playerManager.deleteAll();
};

module.exports.before = function () {
    winston.level = "warn";
};

module.exports.createPlayer = function (name) {
    return new Promise((resolve, reject) => {
        name = name || "Blah";
        const player = playerManager.decide();
        const clientUdp = dgram.createSocket('udp4');
        const clientTcp = net.connect({port: serverTcp.port});
        let sendLoginMsgViaUdpTask = null;

        clientTcp.on('connect', () => {
            const loginMsg = FlatBuffersHelper.loginMsg(name, player.token);

            clientTcp.write(loginMsg);

            const sendLoginMsgViaUdp = () => {
                clientUdp.send(loginMsg, serverUdp.port, serverUdp.address);
                sendLoginMsgViaUdpTask = setTimeout(sendLoginMsgViaUdp, 1);
            };
            sendLoginMsgViaUdpTask = setTimeout(sendLoginMsgViaUdp, 1);
        });

        clientTcp.on('data', message => {
            const data = new Uint8Array(message);
            const buf = new flatbuffers.ByteBuffer(data);

            if (UdpAssets.Code.Remote.Flat.UdpReceived.bufferHasIdentifier(buf)) {
                clearTimeout(sendLoginMsgViaUdpTask);
                sendLoginMsgViaUdpTask = null;
                return;
            }

            if (RoomAssets.Code.Remote.Flat.RoomMsg.bufferHasIdentifier(buf)) {
                const roomMsg = RoomAssets.Code.Remote.Flat.RoomMsg.getRootAsRoomMsg(buf);

                if (roomMsg.dataType() !== RoomAssets.Code.Remote.Flat.RoomData.RoomInfo) {
                    return reject(new Error("Invalid roommsg data type"));
                }

                if (sendLoginMsgViaUdpTask !== null) {
                    return reject(new Error("Received RoomMsg before UdpReceived"));
                }

                return resolve({clientUdp, clientTcp, player});
            }

            return reject(new Error("Invalid buffer identifier"));
        });
    });
};