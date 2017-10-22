const debug = require('debug')('sectord17-game:game-manager');

module.exports = exports = class GameManager {
    shutdown() {
        debug("Shutting down...");
        process.exit();
    }
};