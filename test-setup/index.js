const winston = require('winston');
const net = require('net');
const dgram = require('dgram');
const flatbuffers = require('flatbuffers').flatbuffers;
const UdpAssets = require('../lib/flatbuffers/UdpSchema_generated').Assets;
const FlatBuffersHelper = require('../lib/flatbuffers/helper');
const playerManager = require('../lib/player-manager');
const gameApp = require('../lib/game');

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
        const clientTcp = net.connect({port: gameApp.serverTcp.port});

        clientTcp.on('connect', () => {
            const loginMsg = FlatBuffersHelper.loginMsg(name, player.token);

            clientTcp.write(loginMsg);

            setTimeout(() => clientUdp.send(loginMsg, gameApp.serverUdp.port, gameApp.serverUdp.address), 10);
        });

        clientTcp.on('data', message => {
            const data = new Uint8Array(message);
            const buf = new flatbuffers.ByteBuffer(data);

            if (!UdpAssets.Code.Remote.Flat.UdpReceived.bufferHasIdentifier(buf)) {
                reject("Invalid buffer identifier");
            }

            resolve({clientUdp, clientTcp, player});
        });
    });
};