const winston = require('winston');
const net = require('net');
const dgram = require('dgram');
const flatbuffers = require('flatbuffers').flatbuffers;
const UdpAssets = require('../../src/flatbuffers/UdpSchema_generated').Assets;
const RoomAssets = require('../../src/flatbuffers/RoomSchema_generated').Assets;
const GameAssets = require('../../src/flatbuffers/GameSchema_generated').Assets;
const FlatBuffersHelper = require('../../src/flatbuffers/helper');
const {broadcaster, gameManager, lifeManager, lobby, playerManager, shootManager, serverTCP, serverUDP} = require('./src');
const {prependLength, splitData} = require('../../src/communication/utils');
const GameInProgressEvent = require('../../src/event/events/GameInProgressEvent');
const Buffer = require('buffer').Buffer;

require('unset-timeout');

module.exports.beforeEach = function () {
    winston.level = 'warn';

    gameManager._shutdown = function () {
        //
    };

    shootManager.HIT_POLL_DURATION = 0;
    gameManager.TIME_FOR_GIVING_UP = 0;

    playerManager.deleteAll();

    broadcaster.init();
    gameManager.init();
    lobby.init();
    playerManager.init();
    shootManager.init();
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

module.exports.startGame = packs => new Promise(resolve => {
    broadcaster.listen(GameInProgressEvent, () => {
        packs.forEach(pack => lifeManager.spawnPlayer(pack.player, 50, 20, 20));

        let respawnCounter = 0;

        packs[0].clientTcp.on('data', data => splitData(data, data => {
            const buf = new flatbuffers.ByteBuffer(new Uint8Array(data));

            if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
                const gameData = GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf);
                if (gameData.dataType() === GameAssets.Code.Remote.Flat.Data.PlayerRespawnAckData) {
                    if (++respawnCounter === packs.length) {
                        resolve(packs);
                    }
                }
            }
        }));
    });

    const message = FlatBuffersHelper.roomMsg.meReady(true);
    const buffer = prependLength(message);
    packs.forEach(pack => pack.clientTcp.write(buffer));
});