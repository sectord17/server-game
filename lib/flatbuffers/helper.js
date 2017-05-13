const flatbuffers = require('flatbuffers').flatbuffers;
ServerAssets = require('./ServerSchema_generated').Assets;
GameAssets = require('./GameSchema_generated').Assets;
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

        ServerAssets.Code.Remote.LoginMsg.startLoginMsg(builder);
        ServerAssets.Code.Remote.LoginMsg.addName(builder, bName);
        ServerAssets.Code.Remote.LoginMsg.addToken(builder, bToken);
        const loginMsg = ServerAssets.Code.Remote.LoginMsg.endLoginMsg(builder);

        ServerAssets.Code.Remote.LoginMsg.finishLoginMsgBuffer(builder, loginMsg);

        return Buffer.from(builder.asUint8Array());
    },

    /**
     * @param {*} position
     * @param {*} rotation
     * @returns {Buffer2}
     */
    playerData(position, rotation) {
        const builder = new flatbuffers.Builder(1024);

        GameAssets.Code.Remote.PlayerData.startPlayerData(builder);
        const playerData = GameAssets.Code.Remote.PlayerData.endPlayerData(builder);

        GameAssets.Code.Remote.GameData.startGameData(builder);
        GameAssets.Code.Remote.GameData.addDataType(builder, GameAssets.Code.Remote.Data.PlayerData);
        GameAssets.Code.Remote.GameData.addData(builder, playerData);
        const gameData = GameAssets.Code.Remote.GameData.endGameData(builder);

        GameAssets.Code.Remote.GameData.finishGameDataBuffer(builder, gameData);

        return Buffer.from(builder.asUint8Array());
    }
};