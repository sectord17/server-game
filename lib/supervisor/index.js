const debug = require('debug')('sectord17-game:supervisor');
const ConnectionHandler = require('../communication/server-tcp/connection-handler');

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
        setTimeout(this.checkForAnyPlayer.bind(this), ConnectionHandler.MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE);
    }

    checkForAnyPlayer() {
        const playersCount = this.playerManager.getConnectedPlayers().length;

        if (playersCount === 0) {
            debug("No players after starting cooldown");
            this.gameManager.shutdown();
        }
    }
};
