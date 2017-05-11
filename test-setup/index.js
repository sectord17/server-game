const winston = require('winston');
const playerManager = require('../lib/player-manager');

module.exports.afterEach = function () {
    playerManager.deleteAll();
};

module.exports.before = function () {
    winston.level = "warn";
};
