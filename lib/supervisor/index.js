const debug = require('debug')('sectord17-game:supervisor');
const PlayerManager = require('../game/player-manager');

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
        setTimeout(this.checkForAnyPlayer.bind(this), PlayerManager.MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT + 1000);
    }

    checkForAnyPlayer() {
        const playersCount = this.playerManager.getConnectedPlayers().length;

        if (playersCount === 0) {
            debug("No players after starting cooldown");
            this.gameManager.shutdown();
        }
    }
};
