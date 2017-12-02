const winston = require('winston');
const GameBootedEvent = require('../event/events/GameBootedEvent');
const GameInProgressEvent = require('../event/events/GameInProgressEvent');
const RoomAssets = include('/src/flatbuffers/RoomSchema_generated').Assets;
const FlatBuffersHelper = include('/src/flatbuffers/helper');

const PREPARING = 0;
const STARTING = 1;
const IN_PROGRESS = 2;
const FINISHED = 3;

class GameManager {
    constructor() {
        this.TIME_FOR_GIVING_UP = 5 * 1000;
        this.SHUTDOWN_DELAY = 1 * 1000;
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

        /** @type {Broadcaster} */
        this.broadcaster = dependencies.broadcaster;
    }

    gamePreparing() {
        this.status = PREPARING;

        if (this._timeoutGameInProgress !== null) {
            clearTimeout(this._timeoutGameInProgress);
            this._timeoutGameInProgress = null;
        }

        this.slaveSDK.gameStatusChanged(this.status);

        winston.log('info', "Game is preparing...");
    }

    gameStarting() {
        this.status = STARTING;
        this._sendGameStatusChanged(RoomAssets.Code.Remote.Flat.GameStatus.Start);
        this._timeoutGameInProgress = setTimeout(this.gameInProgress.bind(this), this.TIME_FOR_GIVING_UP);

        this.slaveSDK.gameStatusChanged(this.status);

        winston.log('info', "Game is starting...");
    }

    gameInProgress() {
        this.status = IN_PROGRESS;
        this._markPlayersAsActive();
        this._timeoutGameInProgress = null;
        this._sendGameStatusChanged(RoomAssets.Code.Remote.Flat.GameStatus.InProgress);

        this.slaveSDK.gameStatusChanged(this.status);
        this.broadcaster.fire(new GameInProgressEvent());

        winston.log('info', "Game has started!");
    }

    gameFinish() {
        this.status = FINISHED;
        this._sendGameStatusChanged(RoomAssets.Code.Remote.Flat.GameStatus.Finish);
        setTimeout(this._shutdown.bind(this), this.SHUTDOWN_DELAY);

        this.slaveSDK.gameStatusChanged(this.status);

        winston.log('info', "Game is finishing...");

    }

    isStarting() {
        return this.status === STARTING;
    }

    isInProgress() {
        return this.status === IN_PROGRESS;
    }

    booted() {
        this.slaveSDK.booted();
        this.broadcaster.fire(new GameBootedEvent());
    }

    _shutdown() {
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
}

module.exports = exports = GameManager;
