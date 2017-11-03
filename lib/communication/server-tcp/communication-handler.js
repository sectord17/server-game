const debug = require('debug')('sectord17-game:communication-handler');
const GameAssets = include('/lib/flatbuffers/GameSchema_generated').Assets;
const RoomAssets = include('/lib/flatbuffers/RoomSchema_generated').Assets;
const MessageHandler = require('./message-handler');

module.exports = class CommunicationHandler {
    /**
     * @param {Player} player
     * @param {ConnectionHandler} connectionHandler
     */
    constructor(player, connectionHandler) {
        const {serverUDP} = include('/lib');

        /** @type {ServerUDP} */
        this.serverUDP = serverUDP;
        this.player = player;
        this.connectionHandler = connectionHandler;
        this.address = null;
        this.udpPort = null;
        this.messageHandler = new MessageHandler(player);
    }

    /**
     * @param {string} address
     * @param {int} udpPort
     */
    assignAddress(address, udpPort) {
        this.address = address;
        this.udpPort = udpPort;
    }

    close() {
        this.connectionHandler.close();
    }

    onTcpMessage(message, buf) {
        this.player.touch();

        if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
            return this.messageHandler.onGameData(GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf), message);
        }

        if (RoomAssets.Code.Remote.Flat.RoomMsg.bufferHasIdentifier(buf)) {
            return this.messageHandler.onRoomMsg(RoomAssets.Code.Remote.Flat.RoomMsg.getRootAsRoomMsg(buf));
        }

        debug("Unknown message identifier via TCP");
    }

    onUdpMessage(message, buf) {
        this.player.touch();

        if (GameAssets.Code.Remote.Flat.GameData.bufferHasIdentifier(buf)) {
            return this.messageHandler.onGameData(GameAssets.Code.Remote.Flat.GameData.getRootAsGameData(buf), message);
        }

        debug("Unknown message identifier via UDP");
    }

    sendViaUdp(message) {
        this.serverUDP.send(this.address, this.udpPort, message);
    }

    sendViaTcp(message) {
        this.connectionHandler.send(message);
    }
};