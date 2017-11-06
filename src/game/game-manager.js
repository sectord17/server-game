const winston = require('winston');
const RoomAssets = include('/src/flatbuffers/RoomSchema_generated').Assets;
const FlatBuffersHelper = include('/src/flatbuffers/helper');

const PREPARING = 0;
const STARTING = 1;
const IN_PROGRESS = 2;
const FINISHED = 3;

const TIME_FOR_GIVING_UP = 5000;

module.exports = exports = class GameManager {
    constructor() {
        this.init();
    }

    init() {
        this.status = PREPARING;
        this._timeoutGameInProgress = null;
    }

    use(dependencies) {
        /** @type {PlayerManager} */
        this.playerManager = dependencies.playerManager;

        /** @type {Sender} */
        this.sender = dependencies.sender;

        /** @type {SlaveSDK} */
        this.slaveSDK = dependencies.slaveSDK;
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
        this._markPlayersAsActive();
        this._timeoutGameInProgress = null;
        this._sendGameStatusChanged(RoomAssets.Code.Remote.Flat.GameStatus.InProgress);
    }

    gameFinish() {
        this.status = FINISHED;
        this._sendGameStatusChanged(RoomAssets.Code.Remote.Flat.GameStatus.Finish);
        this.shutdown();
    }

    isInProgress() {
        return this.status === IN_PROGRESS;
    }

    booted() {
        this.slaveSDK.booted();
    }

    shutdown() {
        winston.log('info', "Shutting down...");
        process.exit();
    }

    _sendGameStatusChanged(status) {
        const message = FlatBuffersHelper.roomMsg.gameStatusChanged(status);
        this.sender.toEveryPlayerViaTCP(message);
    }

    _markPlayersAsActive() {
        this.playerManager.getConnectedPlayers().forEach(player => player.touch());
    }
};