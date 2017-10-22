global.include = function (file) {
    return require(__dirname + '/../' + file);
};

const PlayerManager = require('./game/player-manager');
const Lobby = require('./game/lobby');
const ServerTCP = require('./communication/server-tcp');
const ServerUDP = require('./communication/server-udp');
const ServerHTTP = require('./communication/server-http');

const lobby = new Lobby();
const playerManager = new PlayerManager(lobby);
const serverTCP = new ServerTCP(process.env.IP, process.env.GAME_PORT);
const serverUDP = new ServerUDP(playerManager, lobby, process.env.IP, process.env.GAME_PORT);
const serverHTTP = new ServerHTTP(process.env.HTTP_PORT);

module.exports = {
    playerManager,
    lobby,
    serverTCP,
    serverUDP,
    serverHTTP,
};

require('./cli');
serverHTTP.start();
serverTCP.start();
serverUDP.start();
