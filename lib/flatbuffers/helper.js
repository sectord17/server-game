const flatbuffers = require('flatbuffers').flatbuffers;
GameAssets = require('./GameSchema_generated').Assets;
LoginAssets = require('./LoginSchema_generated').Assets;
UdpAssets = require('./UdpSchema_generated').Assets;
RoomAssets = require('./RoomSchema_generated').Assets;
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
    },

    gameData: {
        /**
         * @returns {Buffer2}
         */
        playerData() {
            const builder = new flatbuffers.Builder(1024);

            GameAssets.Code.Remote.Flat.PlayerData.startPlayerData(builder);
            const playerData = GameAssets.Code.Remote.Flat.PlayerData.endPlayerData(builder);

            return this._wrap(builder, playerData, GameAssets.Code.Remote.Flat.Data.PlayerData);
        },

        /**
         * @returns {Buffer2}
         */
        shootData() {
            const builder = new flatbuffers.Builder(1024);

            GameAssets.Code.Remote.Flat.ShootData.startShootData(builder);
            const shootData = GameAssets.Code.Remote.Flat.ShootData.endShootData(builder);

            return this._wrap(builder, shootData, GameAssets.Code.Remote.Flat.Data.ShootData);
        },

        _wrap(builder, data, dataType) {
            GameAssets.Code.Remote.Flat.GameData.startGameData(builder);
            GameAssets.Code.Remote.Flat.GameData.addDataType(builder, dataType);
            GameAssets.Code.Remote.Flat.GameData.addData(builder, data);
            const gameData = GameAssets.Code.Remote.Flat.GameData.endGameData(builder);

            GameAssets.Code.Remote.Flat.GameData.finishGameDataBuffer(builder, gameData);

            return Buffer.from(builder.asUint8Array());
        }
    },

    roomMsg: {
        /**
         * @param {Array.<Player>} players
         * @returns {Buffer2}
         */
        roomInfo(players) {
            const builder = new flatbuffers.Builder(1024);

            const playerInfos = players.map(player => this._playerInfo(builder, player));
            const playersVector = RoomAssets.Code.Remote.Flat.RoomInfo.createPlayersVector(builder, playerInfos);

            RoomAssets.Code.Remote.Flat.RoomInfo.startRoomInfo(builder);
            RoomAssets.Code.Remote.Flat.RoomInfo.addPlayers(builder, playersVector);
            const roomInfo = RoomAssets.Code.Remote.Flat.RoomInfo.endRoomInfo(builder);

            return this._wrap(builder, roomInfo, RoomAssets.Code.Remote.Flat.Data.RoomData.RoomInfo);
        },

        /**
         * @param {int} playerId
         * @returns {Buffer2}
         */
        playerConnected(playerId) {
            const builder = new flatbuffers.Builder(1024);

            RoomAssets.Code.Remote.Flat.PlayerConnected.startPlayerConnected(builder);
            RoomAssets.Code.Remote.Flat.PlayerConnected.addPlayerId(builder, playerId);
            const playerConnected = RoomAssets.Code.Remote.Flat.PlayerConnected.endPlayerConnected(builder);

            return this._wrap(builder, playerConnected, RoomAssets.Code.Remote.Flat.Data.RoomData.PlayerConnected);
        },

        /**
         * @param {int} playerId
         * @returns {Buffer2}
         */
        playerDisconnected(playerId) {
            const builder = new flatbuffers.Builder(1024);

            RoomAssets.Code.Remote.Flat.PlayerDisconnected.startPlayerDisconnected(builder);
            RoomAssets.Code.Remote.Flat.PlayerDisconnected.addPlayerId(builder, playerId);
            const playerDisconnected = RoomAssets.Code.Remote.Flat.PlayerDisconnected.endPlayerDisconnected(builder);

            return this._wrap(builder, playerDisconnected, RoomAssets.Code.Remote.Flat.Data.RoomData.PlayerDisconnected);
        },

        /**
         * @param {int} playerId
         * @param {boolean} ready
         * @returns {Buffer2}
         */
        playerReady(playerId, ready = true) {
            const builder = new flatbuffers.Builder(1024);

            RoomAssets.Code.Remote.Flat.PlayerReady.startPlayerReady(builder);
            RoomAssets.Code.Remote.Flat.PlayerReady.addPlayerId(builder, playerId);
            RoomAssets.Code.Remote.Flat.PlayerReady.addIsReady(builder, ready);
            const playerReady = RoomAssets.Code.Remote.Flat.PlayerReady.endPlayerReady(builder);

            return this._wrap(builder, playerReady, RoomAssets.Code.Remote.Flat.Data.RoomData.PlayerReady);
        },

        meReady() {

        },

        gameStart() {
            const builder = new flatbuffers.Builder(1024);

            RoomAssets.Code.Remote.Flat.GameStart.startGameStart(builder);
            const gameStart = RoomAssets.Code.Remote.Flat.GameStart.endGameStart(builder);

            return this._wrap(builder, gameStart, RoomAssets.Code.Remote.Flat.Data.RoomData.GameStart);
        },

        /**
         * @param builder
         * @param {Player} player
         * @private
         */
        _playerInfo(builder, player) {
            RoomAssets.Code.Remote.Flat.PlayerInfo.startPlayerInfo(builder);
            RoomAssets.Code.Remote.Flat.PlayerInfo.addPlayerId(builder, player.id);
            RoomAssets.Code.Remote.Flat.PlayerInfo.addIsReady(builder, true); // TODO: Get is ready
            RoomAssets.Code.Remote.Flat.PlayerInfo.addNick(builder, player.name);

            return RoomAssets.Code.Remote.Flat.PlayerInfo.endPlayerInfo(builder);
        },

        _wrap(builder, data, dataType) {
            RoomAssets.Code.Remote.Flat.RoomMsg.startRoomMsg(builder);
            RoomAssets.Code.Remote.Flat.RoomMsg.addDataType(builder, dataType);
            RoomAssets.Code.Remote.Flat.RoomMsg.addData(builder, data);
            const roomMsg = RoomAssets.Code.Remote.Flat.RoomMsg.endRoomMsg(builder);

            GameAssets.Code.Remote.Flat.GameData.finishRoomMsgBuffer(builder, roomMsg);

            return Buffer.from(builder.asUint8Array());
        }
    }
};