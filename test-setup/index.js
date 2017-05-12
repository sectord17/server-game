const winston = require('winston');
const net = require('net');
const dgram = require('dgram');
const FlatBuffersHelper = require('../lib/flatbuffers/helper');
const playerManager = require('../lib/player-manager');
const gameApp = require('../lib/game');

module.exports.afterEach = function () {
    playerManager.deleteAll();
};

module.exports.before = function () {
    winston.level = "warn";
};

module.exports.createPlayer = function () {
    return new Promise((resolve, reject) => {
        const player = playerManager.decide();
        const clientUdp = dgram.createSocket('udp4');
        const clientTcp = net.connect({port: gameApp.serverTcp.port});
        const name = "Blah";

        clientUdp.bind(0, () => {
            const udpPort = clientUdp.address().port;

            clientTcp.on('connect', () => {
                clientTcp.write(FlatBuffersHelper.loginMsg(name, player.token, udpPort));
                setTimeout(() => resolve({clientUdp, clientTcp, player}), 10);
            });
        });
    });
};