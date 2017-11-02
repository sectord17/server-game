const config = require('../../lib/config/index');

config.set('IP', '127.0.0.1');
config.set('GAME_PORT', '0');
config.set('HTTP_PORT', '0');
config.set('TOKEN', 'secret');

module.exports = require('../../lib');
