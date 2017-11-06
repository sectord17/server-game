const winston = require('winston');
const moment = require('moment');
const debug = require('debug')('sectord17-game:supervisor');

const MAX_PLAYER_IDLE = 60 * 1000;
const CHECK_IDLE_INTERVAL = 5 * 1000;

module.exports = exports = class Supervisor {
    /**
     * @param {PlayerManager} playerManager
     * @param {GameManager} gameManager
     */
    constructor(playerManager, gameManager) {
        this.playerManager = playerManager;
        this.gameManager = gameManager;
    }

    watch() {
        setTimeout(this.checkForAnyPlayer.bind(this), this.playerManager.MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT + 1000);
        this.disconnectIdlePlayers();
    }

    checkForAnyPlayer() {
        const playersCount = this.playerManager.getConnectedPlayers().length;

        if (playersCount === 0) {
            debug("No players after starting cooldown");
            this.gameManager.shutdown();
        }
    }

    disconnectIdlePlayers() {
        setTimeout(this.disconnectIdlePlayers.bind(this), CHECK_IDLE_INTERVAL);

        if (!this.gameManager.isInProgress()) {
            return;
        }

        this.playerManager.getConnectedPlayers()
            .filter(player => player.lastActiveAt.valueOf() + MAX_PLAYER_IDLE < moment().valueOf())
            .forEach(player => {
                winston.log('info', `Player ${player.getInlineDetails()} was idle longer than ${MAX_PLAYER_IDLE}ms`);
                this.playerManager.disconnect(player)
            });
    }
};
