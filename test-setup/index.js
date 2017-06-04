const winston = require('winston');
const net = require('net');
const dgram = require('dgram');
const flatbuffers = require('flatbuffers').flatbuffers;
const UdpAssets = require('../lib/flatbuffers/UdpSchema_generated').Assets;
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
        let sendLoginMsgCiaUdpTask = null;

        clientTcp.on('connect', () => {
            const loginMsg = FlatBuffersHelper.loginMsg(name, player.token);

            clientTcp.write(loginMsg);

            const sendLoginMsgViaUdp = () => {
                clientUdp.send(loginMsg, serverUdp.port, serverUdp.address);
                sendLoginMsgCiaUdpTask = setTimeout(sendLoginMsgViaUdp, 1);
            };
            sendLoginMsgCiaUdpTask = setTimeout(sendLoginMsgViaUdp, 1);
        });

        clientTcp.on('data', message => {
            const data = new Uint8Array(message);
            const buf = new flatbuffers.ByteBuffer(data);

            if (!UdpAssets.Code.Remote.Flat.UdpReceived.bufferHasIdentifier(buf)) {
                return reject("Invalid buffer identifier");
            }

            clearTimeout(sendLoginMsgCiaUdpTask);

            return resolve({clientUdp, clientTcp, player});
        });
    });
};