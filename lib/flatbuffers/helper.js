const flatbuffers = require('flatbuffers').flatbuffers;
GameAssets = require('./GameSchema_generated').Assets;
LoginAssets = require('./LoginSchema_generated').Assets;
UdpAssets = require('./UdpSchema_generated').Assets;
const Buffer = require('buffer').Buffer;

module.exports = {
    /**
     * @param {string} name
     * @param {string} token
     * @return {Buffer2}
     */
    loginMsg(name, token) {
        const builder = new flatbuffers.Builder(1024);
        const bName = builder.createString(name);
        const bToken = builder.createString(token);

        LoginAssets.Code.Remote.Flat.LoginMsg.startLoginMsg(builder);
        LoginAssets.Code.Remote.Flat.LoginMsg.addName(builder, bName);
        LoginAssets.Code.Remote.Flat.LoginMsg.addToken(builder, bToken);
        const loginMsg = LoginAssets.Code.Remote.Flat.LoginMsg.endLoginMsg(builder);

        LoginAssets.Code.Remote.Flat.LoginMsg.finishLoginMsgBuffer(builder, loginMsg);

        return Buffer.from(builder.asUint8Array());
    },

    /**
     * @returns {Buffer2}
     */
    playerData() {
        const builder = new flatbuffers.Builder(1024);

        GameAssets.Code.Remote.Flat.PlayerData.startPlayerData(builder);
        const playerData = GameAssets.Code.Remote.Flat.PlayerData.endPlayerData(builder);

        GameAssets.Code.Remote.Flat.GameData.startGameData(builder);
        GameAssets.Code.Remote.Flat.GameData.addDataType(builder, GameAssets.Code.Remote.Flat.Data.PlayerData);
        GameAssets.Code.Remote.Flat.GameData.addData(builder, playerData);
        const gameData = GameAssets.Code.Remote.Flat.GameData.endGameData(builder);

        GameAssets.Code.Remote.Flat.GameData.finishGameDataBuffer(builder, gameData);

        return Buffer.from(builder.asUint8Array());
    },

    /**
     * @returns {Buffer2}
     */
    shootData() {
        const builder = new flatbuffers.Builder(1024);

        GameAssets.Code.Remote.Flat.ShootData.startShootData(builder);
        const shootData = GameAssets.Code.Remote.Flat.ShootData.endShootData(builder);

        GameAssets.Code.Remote.Flat.GameData.startGameData(builder);
        GameAssets.Code.Remote.Flat.GameData.addDataType(builder, GameAssets.Code.Remote.Flat.Data.ShootData);
        GameAssets.Code.Remote.Flat.GameData.addData(builder, shootData);
        const gameData = GameAssets.Code.Remote.Flat.GameData.endGameData(builder);

        GameAssets.Code.Remote.Flat.GameData.finishGameDataBuffer(builder, gameData);

        return Buffer.from(builder.asUint8Array());
    },

    /**
     * @param {int} playerId
     * @returns {Buffer2}
     */
    udpReceived(playerId) {
        const builder = new flatbuffers.Builder(1024);

        UdpAssets.Code.Remote.Flat.UdpReceived.startUdpReceived(builder);
        UdpAssets.Code.Remote.Flat.UdpReceived.addPlayerId(builder, playerId);
        const udpReceived = UdpAssets.Code.Remote.Flat.UdpReceived.endUdpReceived(builder);

        UdpAssets.Code.Remote.Flat.UdpReceived.finishUdpReceivedBuffer(builder, udpReceived);

        return Buffer.from(builder.asUint8Array());
    }
};