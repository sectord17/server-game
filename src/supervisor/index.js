const winston = require('winston');
const moment = require('moment');
const debug = require('debug')('sectord17-game:supervisor');

module.exports = exports = class Supervisor {
    constructor() {
        this.MAX_PLAYER_IDLE = 60 * 1000;
        this.CHECK_IDLE_INTERVAL = 5 * 1000;
    }

    use(dependencies) {
        /** @type {PlayerManager} */
        this.playerManager = dependencies.playerManager;

        /** @type {GameManager} */
        this.gameManager = dependencies.gameManager;
    }

    watch() {
        setTimeout(this.checkForAnyPlayer.bind(this), this.playerManager.MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT + 1000);
        setInterval(this.disconnectIdlePlayers.bind(this), this.CHECK_IDLE_INTERVAL);
    }

    checkForAnyPlayer() {
        const playersCount = this.playerManager.getConnectedPlayers().length;

        if (playersCount === 0) {
            debug("No players after starting cooldown");
            this.gameManager.shutdown();
        }
    }

    disconnectIdlePlayers() {
        if (!this.gameManager.isInProgress()) {
            return;
        }

        this.playerManager.getConnectedPlayers()
            .filter(player => this._isPlayerIdle(player))
            .forEach(player => {
                winston.log('info', `Player ${player.getInlineDetails()} was idle for longer than ${this.MAX_PLAYER_IDLE}ms`);
                this.playerManager.disconnect(player)
            });
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     * @private
     */
    _isPlayerIdle(player) {
        return player.lastActiveAt.valueOf() + this.MAX_PLAYER_IDLE < moment().valueOf();
    }
};
