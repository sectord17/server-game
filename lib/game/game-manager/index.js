const winston = require('winston');
const RoomAssets = include('/lib/flatbuffers/RoomSchema_generated').Assets;
const FlatBuffersHelper = include('/lib/flatbuffers/helper');

const PREPARING = 0;
const STARTING = 1;
const IN_PROGRESS = 2;
const FINISHED = 3;

const TIME_FOR_GIVING_UP = 5000;

module.exports = exports = class GameManager {
    constructor() {
        /** @type {PlayerManager} */
        this.playerManager = null;
        this.status = PREPARING;
        this._timeoutGameInProgress = null;
    }

    use(dependencies) {
        this.playerManager = dependencies.playerManager;
    }

    gamePreparing() {
        this.status = PREPARING;

        if (this._timeoutGameInProgress !== null) {
            clearTimeout(this._timeoutGameInProgress);
            this._timeoutGameInProgress = null;
        }
    }

    gameStarting() {
        this.status = STARTING;
        this._timeoutGameInProgress = setTimeout(this.gameInProgress.bind(this), TIME_FOR_GIVING_UP);
        this._sendGameStatusChanged(RoomAssets.Code.Remote.Flat.GameStatus.Start);
    }

    gameInProgress() {
        this.status = IN_PROGRESS;
        this._timeoutGameInProgress = null;
        this._sendGameStatusChanged(RoomAssets.Code.Remote.Flat.GameStatus.InProgress);
    }

    gameFinish() {
        this.status = FINISHED;
        this._sendGameStatusChanged(RoomAssets.Code.Remote.Flat.GameStatus.Finish);
    }

    shutdown() {
        winston.log('info', "Shutting down...");
        process.exit();
    }

    _sendGameStatusChanged(status) {
        const gameStatusChanged = FlatBuffersHelper.roomMsg.gameStatusChanged(status);

        this.playerManager
            .allConnected()
            // TODO: Stupid fix for TCP stream nature
            .forEach(player => setTimeout(() => player.communicationHandler.sendViaTcp(gameStatusChanged), 50));
    }
};