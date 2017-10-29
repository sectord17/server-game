const debug = require('debug')('sectord17-game:supervisor');

const PLAYER_CHECK_STARTING_COOLDOWN = 5 * 1000;

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
        setTimeout(this.checkForAnyPlayer.bind(this), PLAYER_CHECK_STARTING_COOLDOWN);
    }

    checkForAnyPlayer() {
        const playersCount = this.playerManager.getConnectedPlayers().length;

        if (playersCount === 0) {
            debug("No players after starting cooldown");
            this.gameManager.shutdown();
        }
    }
};
