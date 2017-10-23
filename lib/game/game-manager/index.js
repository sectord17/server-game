const winston = require('winston');

module.exports = exports = class GameManager {
    shutdown() {
        winston.log('info', "Shutting down...");
        process.exit();
    }
};