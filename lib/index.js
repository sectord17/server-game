global.include = function (file) {
    return require(__dirname + '/../' + file);
};

const Supervisor = require('./supervisor');
const PlayerManager = require('./game/player-manager');
const GameManager = require('./game/game-manager');
const Lobby = require('./game/lobby');
const Sender = require('./communication/sender');
const ServerTCP = require('./communication/server-tcp');
const ServerUDP = require('./communication/server-udp');
const ServerHTTP = require('./communication/server-http');
const SlaveSDK = require('./apis/slave-sdk');

const slaveSDK = new SlaveSDK();
const gameManager = new GameManager();
const lobby = new Lobby();
const sender = new Sender();
const playerManager = new PlayerManager(gameManager, lobby, sender, slaveSDK);
const supervisor = new Supervisor(playerManager, gameManager);
const serverTCP = new ServerTCP(process.env.IP, process.env.GAME_PORT);
const serverUDP = new ServerUDP(playerManager, lobby, process.env.IP, process.env.GAME_PORT);
const serverHTTP = new ServerHTTP(process.env.HTTP_PORT);

gameManager.use({playerManager, sender, slaveSDK});
lobby.use({gameManager, playerManager, sender});
sender.use({playerManager});

module.exports = {
    playerManager,
    gameManager,
    lobby,
    sender,
    serverTCP,
    serverUDP,
    serverHTTP,
    slaveSDK,
    supervisor,
};

require('./cli');

Promise.all([
    supervisor.watch(),
    serverHTTP.start(),
    serverTCP.start(),
    serverUDP.start()
])
    .then(() => gameManager.booted());