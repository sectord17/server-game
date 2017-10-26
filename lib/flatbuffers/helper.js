const flatbuffers = require('flatbuffers').flatbuffers;
const GameAssets = require('./GameSchema_generated').Assets;
const LoginAssets = require('./LoginSchema_generated').Assets;
const UdpAssets = require('./UdpSchema_generated').Assets;
const ErrorAssets = require('./ErrorSchema_generated').Assets;
const RoomAssets = require('./RoomSchema_generated').Assets;
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

    /**
     * @param {int} code
     * @param {string} message
     * @returns {Buffer2}
     */
    error(code, message = '') {
        const builder = new flatbuffers.Builder(1024);
        const bMessage = builder.createString(message);

        ErrorAssets.Code.Remote.Flat.ErrorMessage.startErrorMessage(builder);
        UdpAssets.Code.Remote.Flat.ErrorMessage.addMessage(builder, bMessage);
        UdpAssets.Code.Remote.Flat.ErrorMessage.addErrorCode(builder, code);
        const errorMessage = UdpAssets.Code.Remote.Flat.ErrorMessage.endErrorMessage(builder);

        ErrorAssets.Code.Remote.Flat.ErrorMessage.finishErrorMessageBuffer(builder, errorMessage);

        return Buffer.from(builder.asUint8Array());
    },

    gameData: {
        /**
         * @param {int} senderId
         * @returns {Buffer2}
         */
        playerData(senderId) {
            const builder = new flatbuffers.Builder(1024);

            GameAssets.Code.Remote.Flat.PlayerData.startPlayerData(builder);
            const data = GameAssets.Code.Remote.Flat.PlayerData.endPlayerData(builder);

            return this._wrap(builder, senderId, data, GameAssets.Code.Remote.Flat.Data.PlayerData);
        },

        /**
         * @param {int} senderId
         * @returns {Buffer2}
         */
        shootData(senderId) {
            const builder = new flatbuffers.Builder(1024);

            GameAssets.Code.Remote.Flat.ShootData.startShootData(builder);
            const data = GameAssets.Code.Remote.Flat.ShootData.endShootData(builder);

            return this._wrap(builder, senderId, data, GameAssets.Code.Remote.Flat.Data.ShootData);
        },

        /**
         * @param {int} playerId
         * @param {int} points
         * @param reason
         * @returns {Buffer2}
         */
        pointsChangedData(playerId, points, reason) {
            const builder = new flatbuffers.Builder(1024);
            const reason = reason(builder);

            GameAssets.Code.Remote.Flat.PointsChangedData.startPointsChangedData(builder);
            GameAssets.Code.Remote.Flat.PointsChangedData.addPlayerId(builder, playerId);
            GameAssets.Code.Remote.Flat.PointsChangedData.addPoints(builder, points);
            GameAssets.Code.Remote.Flat.PointsChangedData.addReason(builder, reason);
            const data = GameAssets.Code.Remote.Flat.PointsChangedData.endPointsChangedData(builder);

            return this._wrap(builder, 0, data, GameAssets.Code.Remote.Flat.Data.PointsChangedData);
        },

        pointReasons: {
            /**
             * @param builder
             * @param {int} killerId
             * @param {int} targetId
             * @returns {flatbuffers.Offset}
             */
            kill(builder, killerId, targetId) {
                GameAssets.Code.Remote.Flat.KillReason.startKillReason(builder);
                GameAssets.Code.Remote.Flat.KillReason.addKillerId(builder, killerId);
                GameAssets.Code.Remote.Flat.KillReason.addTargetId(builder, targetId);

                return GameAssets.Code.Remote.Flat.KillReason.endKillReason(builder);
            }
        },

        /**
         * @param {int} playerId
         * @returns {Buffer2}
         */
        playerDeathData(playerId) {
            const builder = new flatbuffers.Builder(1024);

            GameAssets.Code.Remote.Flat.PlayerDeathData.startPlayerDeathData(builder);
            GameAssets.Code.Remote.Flat.PlayerDeathData.addPlayerId(builder, playerId);
            const data = GameAssets.Code.Remote.Flat.PlayerDeathData.endPlayerDeathData(builder);

            return this._wrap(builder, 0, data, GameAssets.Code.Remote.Flat.Data.PlayerDeathData);
        },

        /**
         * @param {int} playerId
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @returns {Buffer2}
         */
        playerRespawnAckData(playerId, x, y, z) {
            const builder = new flatbuffers.Builder(1024);

            GameAssets.Code.Remote.Flat.PlayerRespawnAckData.startPlayerRespawnAckData(builder);
            GameAssets.Code.Remote.Flat.PlayerRespawnAckData.addPlayerId(builder, playerId);
            GameAssets.Code.Remote.Flat.PlayerRespawnAckData.addPosition(
                builder, GameAssets.Code.Remote.Flat.Vec3.createVec3(builder, x, y, z)
            );
            const data = GameAssets.Code.Remote.Flat.PlayerRespawnAckData.endPlayerRespawnAckData(builder);

            return this._wrap(builder, 0, data, GameAssets.Code.Remote.Flat.Data.PlayerDeathData);
        },

        _wrap(builder, senderId, data, dataType) {
            GameAssets.Code.Remote.Flat.GameData.startGameData(builder);
            GameAssets.Code.Remote.Flat.GameData.addDataType(builder, dataType);
            GameAssets.Code.Remote.Flat.GameData.addData(builder, data);
            GameAssets.Code.Remote.Flat.GameData.addSenderId(builder, senderId);
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

            return this._wrap(builder, roomInfo, RoomAssets.Code.Remote.Flat.RoomData.RoomInfo);
        },

        /**
         * @param {int} id
         * @param {string} name
         * @param team
         * @returns {Buffer2}
         */
        playerConnected(id, name, team) {
            const builder = new flatbuffers.Builder(1024);
            const nick = builder.createString(name);

            RoomAssets.Code.Remote.Flat.PlayerConnected.startPlayerConnected(builder);
            RoomAssets.Code.Remote.Flat.PlayerConnected.addPlayerId(builder, id);
            RoomAssets.Code.Remote.Flat.PlayerConnected.addNick(builder, nick);
            RoomAssets.Code.Remote.Flat.PlayerConnected.addTeam(builder, team);
            const playerConnected = RoomAssets.Code.Remote.Flat.PlayerConnected.endPlayerConnected(builder);

            return this._wrap(builder, playerConnected, RoomAssets.Code.Remote.Flat.RoomData.PlayerConnected);
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

            return this._wrap(builder, playerDisconnected, RoomAssets.Code.Remote.Flat.RoomData.PlayerDisconnected);
        },

        /**
         * @param {int} playerId
         * @param {boolean} ready
         * @returns {Buffer2}
         */
        playerReady(playerId, ready) {
            const builder = new flatbuffers.Builder(1024);

            RoomAssets.Code.Remote.Flat.PlayerReady.startPlayerReady(builder);
            RoomAssets.Code.Remote.Flat.PlayerReady.addPlayerId(builder, playerId);
            RoomAssets.Code.Remote.Flat.PlayerReady.addIsReady(builder, ready);
            const playerReady = RoomAssets.Code.Remote.Flat.PlayerReady.endPlayerReady(builder);

            return this._wrap(builder, playerReady, RoomAssets.Code.Remote.Flat.RoomData.PlayerReady);
        },

        /**
         * @param {int} playerId
         * @param {RoomAssets.Code.Remote.Flat.Team} team
         * @returns {Buffer2}
         */
        teamChanged(playerId, team) {
            const builder = new flatbuffers.Builder(1024);

            RoomAssets.Code.Remote.Flat.TeamChanged.startTeamChanged(builder);
            RoomAssets.Code.Remote.Flat.TeamChanged.addPlayerId(builder, playerId);
            RoomAssets.Code.Remote.Flat.TeamChanged.addTeam(builder, team);
            const teamChanged = RoomAssets.Code.Remote.Flat.TeamChanged.endTeamChanged(builder);

            return this._wrap(builder, teamChanged, RoomAssets.Code.Remote.Flat.RoomData.TeamChanged);
        },

        /**
         * @param {int} playerId
         * @param {RoomAssets.Code.Remote.Flat.Team} team
         * @returns {Buffer2}
         */
        changeTeam(playerId, team) {
            const builder = new flatbuffers.Builder(1024);

            RoomAssets.Code.Remote.Flat.ChangeTeam.startChangeTeam(builder);
            RoomAssets.Code.Remote.Flat.ChangeTeam.addPlayerId(builder, playerId);
            RoomAssets.Code.Remote.Flat.ChangeTeam.addTeam(builder, team);
            const changeTeam = RoomAssets.Code.Remote.Flat.ChangeTeam.endChangeTeam(builder);

            return this._wrap(builder, changeTeam, RoomAssets.Code.Remote.Flat.RoomData.ChangeTeam);
        },

        /**
         * @param {boolean} ready
         * @returns {Buffer2}
         */
        meReady(ready) {
            const builder = new flatbuffers.Builder(1024);

            RoomAssets.Code.Remote.Flat.MeReady.startMeReady(builder);
            RoomAssets.Code.Remote.Flat.MeReady.addIsReady(builder, ready);
            const meReady = RoomAssets.Code.Remote.Flat.MeReady.endMeReady(builder);

            return this._wrap(builder, meReady, RoomAssets.Code.Remote.Flat.RoomData.MeReady);
        },

        /**
         * @param {RoomAssets.Code.Remote.Flat.GameStatus} status
         * @returns {Buffer2}
         */
        gameStatusChanged(status) {
            const builder = new flatbuffers.Builder(1024);

            RoomAssets.Code.Remote.Flat.GameStatusChanged.startGameStatusChanged(builder);
            RoomAssets.Code.Remote.Flat.GameStatusChanged.addStatus(builder, status);
            const gameStatusChanged = RoomAssets.Code.Remote.Flat.GameStatusChanged.endGameStatusChanged(builder);

            return this._wrap(builder, gameStatusChanged, RoomAssets.Code.Remote.Flat.RoomData.GameStatusChanged);
        },

        /**
         * @param builder
         * @param {Player} player
         * @private
         */
        _playerInfo(builder, player) {
            const {lobby} = include('/lib');
            const nick = builder.createString(player.name);

            RoomAssets.Code.Remote.Flat.PlayerInfo.startPlayerInfo(builder);
            RoomAssets.Code.Remote.Flat.PlayerInfo.addPlayerId(builder, player.id);
            RoomAssets.Code.Remote.Flat.PlayerInfo.addIsReady(builder, lobby.isReady(player));
            RoomAssets.Code.Remote.Flat.PlayerInfo.addNick(builder, nick);
            RoomAssets.Code.Remote.Flat.PlayerInfo.addTeam(builder, player.team);

            return RoomAssets.Code.Remote.Flat.PlayerInfo.endPlayerInfo(builder);
        },

        _wrap(builder, data, dataType) {
            RoomAssets.Code.Remote.Flat.RoomMsg.startRoomMsg(builder);
            RoomAssets.Code.Remote.Flat.RoomMsg.addDataType(builder, dataType);
            RoomAssets.Code.Remote.Flat.RoomMsg.addData(builder, data);
            const roomMsg = RoomAssets.Code.Remote.Flat.RoomMsg.endRoomMsg(builder);

            RoomAssets.Code.Remote.Flat.RoomMsg.finishRoomMsgBuffer(builder, roomMsg);

            return Buffer.from(builder.asUint8Array());
        }
    }
};