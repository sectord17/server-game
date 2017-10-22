const debug = require('debug')('sectord17-game:supervisor');

const PLAYER_CHECK_STARTING_COOLDOWN = 5 * 1000;

module.exports = exports = class Supervisor {
    /**
     * @param {PlayerManager} playerManager
     * @param {SlaveSDK} slaveSDK
     */
    constructor(playerManager, slaveSDK) {
        this.playerManager = playerManager;
        this.slaveSDK = slaveSDK;
    }

    watch() {
        setTimeout(this.checkForAnyPlayer.bind(this), PLAYER_CHECK_STARTING_COOLDOWN);
    }

    checkForAnyPlayer() {
        const playersCount = this.playerManager.allConnected().length;

        if (playersCount === 0) {
            debug("No players after starting cooldown");
            this.slaveSDK.noPlayers();
        }
    }
};
