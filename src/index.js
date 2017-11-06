const {include} = require('./utils');

global.include = include;

const Supervisor = require('./supervisor');
const PlayerManager = require('./game/player-manager');
const GameManager = require('./game/game-manager');
const LifeManager = require('./game/life-manager');
const Lobby = require('./game/lobby');
const Sender = require('./communication/sender');
const ServerTCP = require('./communication/server-tcp');
const ServerUDP = require('./communication/server-udp');
const ServerHTTP = require('./communication/server-http');
const ShootManager = require('./game/shoot-manager');
const StatsManager = require('./game/stats-manager');
const SlaveSDK = require('./sdk/slave-sdk');
const config = require('./config');

let gamePort = config.get('GAME_PORT');
let httpPort = config.get('HTTP_PORT');

const slaveSDK = new SlaveSDK();
const gameManager = new GameManager();
const lobby = new Lobby();
const sender = new Sender();
const statsManager = new StatsManager(sender, gameManager);
const lifeManager = new LifeManager(sender, statsManager);
const playerManager = new PlayerManager(gameManager, lifeManager, statsManager, lobby, sender, slaveSDK);
const shootManager = new ShootManager(playerManager);
const supervisor = new Supervisor(playerManager, gameManager);
const serverTCP = new ServerTCP(gamePort);
const serverUDP = new ServerUDP(playerManager, lobby, gamePort);
const serverHTTP = new ServerHTTP(httpPort);

gameManager.use({playerManager, sender, slaveSDK});
lobby.use({gameManager, playerManager, sender});
sender.use({playerManager});

module.exports = exports = {
    lifeManager,
    gameManager,
    playerManager,
    shootManager,
    statsManager,
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