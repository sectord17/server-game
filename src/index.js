const {include} = require('./utils');

global.include = include;

const Supervisor = require('./supervisor');
const Broadcaster = require('./event/broadcaster');
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
const TeamManager = require('./game/team-manager');
const SlaveSDK = require('./sdk/slave-sdk');
const config = require('./config');

let gamePort = config.get('GAME_PORT');
let httpPort = config.get('HTTP_PORT');

const slaveSDK = new SlaveSDK();
const broadcaster = new Broadcaster();
const gameManager = new GameManager();
const lobby = new Lobby();
const sender = new Sender();
const statsManager = new StatsManager();
const lifeManager = new LifeManager();
const playerManager = new PlayerManager();
const teamManager = new TeamManager();
const shootManager = new ShootManager();
const supervisor = new Supervisor();
const serverTCP = new ServerTCP(gamePort);
const serverUDP = new ServerUDP(gamePort);
const serverHTTP = new ServerHTTP(httpPort);

const dependencies = {
    broadcaster,
    lifeManager,
    gameManager,
    playerManager,
    shootManager,
    statsManager,
    teamManager,
    lobby,
    sender,
    serverTCP,
    serverUDP,
    serverHTTP,
    slaveSDK,
    supervisor,
};

gameManager.use(dependencies);
playerManager.use(dependencies);
lifeManager.use(dependencies);
statsManager.use(dependencies);
teamManager.use(dependencies);
shootManager.use(dependencies);
supervisor.use(dependencies);
lobby.use(dependencies);
sender.use(dependencies);
serverUDP.use(dependencies);

module.exports = exports = dependencies;

require('./cli');

Promise.all([
    supervisor.watch(),
    serverHTTP.start(),
    serverTCP.start(),
    serverUDP.start()
])
    .then(() => gameManager.booted());