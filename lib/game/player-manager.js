const uuidV4 = require('uuid/v4');
const debug = require('debug')('sectord17-game:player-manager');
const winston = require('winston');
const Player = require('./player');
const CommunicationHandler = include('/lib/communication/server-tcp/communication-handler');
const ConnectingError = include('/lib/errors/connecting-error');
const ModelNotFoundError = include('/lib/errors/model-not-found-error');
const FlatBuffersHelper = include('/lib/flatbuffers/helper');

const MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT = 5 * 1000; // 5 seconds
const MAX_PLAYERS = 8;

module.exports = exports = class PlayerManager {
    /**
     * @param {GameManager} gameManager
     * @param {LifeManager} lifeManager
     * @param {StatsManager} statsManager
     * @param {Lobby} lobby
     * @param {Sender} sender
     * @param {SlaveSDK} slaveSDK
     */
    constructor(gameManager, lifeManager, statsManager, lobby, sender, slaveSDK) {
        this.gameManager = gameManager;
        this.lifeManager = lifeManager;
        this.statsManager = statsManager;
        this.lobby = lobby;
        this.sender = sender;
        this.slaveSDK = slaveSDK;

        // Token => Player
        this.players = new Map();

        // Id => Player
        this.connectedPlayers = new Map();
    }

    /**
     * @returns {Array.<Player>}
     */
    all() {
        return Array.from(this.players.values());
    }

    /**
     * @returns {Array.<Player>}
     */
    allConnected() {
        return Array.from(this.connectedPlayers.values());
    }

    // Handshake flow
    // Decide -> Authorize -> Connect

    /**
     * @returns {Player}
     */
    decide() {
        if (this._isFull()) {
            throw new ConnectingError("too_many_players");
        }

        const token = uuidV4();
        const team = this._chooseTeam();
        const player = new Player(token, team);

        this.players.set(token, player);

        setTimeout(() => this._deleteIfNotConnected(player, token), MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT);

        return player;
    }

    /**
     * @param {string} token
     * @param {string} name
     * @param {ConnectionHandler} connectionHandler
     * @returns {Promise.<Player>}
     */
    authorize(token, name, connectionHandler) {
        return new Promise((resolve, reject) => {
            const player = this.players.get(token);
            if (!player) {
                return reject(new ConnectingError("invalid_token"));
            }

            if (player.isAuthorized()) {
                return reject(new ConnectingError("already_authorized"));
            }

            const communicationHandler = new CommunicationHandler(player, connectionHandler);
            player.setAuthorized(name, communicationHandler);

            debug(`Player ${player.getInlineDetails()} authorized`);

            return resolve(player);
        });
    }

    /**
     * @param {string} token
     * @param {string} address
     * @param {int} udpPort
     * @returns {Promise.<Player>}
     */
    connect(token, address, udpPort) {
        return new Promise((resolve, reject) => {
            const player = this.players.get(token);
            if (!player) {
                return reject(new ConnectingError("invalid_token"));
            }

            if (!player.isAuthorized()) {
                return reject(new ConnectingError("not_authorized"));
            }

            if (player.isConnected()) {
                return reject(new ConnectingError("already_connected"));
            }

            const id = this._getUnoccupiedId();
            if (id === null) {
                return reject(ConnectingError("too_many_players", player));
            }

            player.communicationHandler.assignAddress(address, udpPort);
            player.setConnected(id);
            this.connectedPlayers.set(player.id, player);
            this._onPlayersCountChanged();

            winston.log('info', `Player ${player.getInlineDetails()} connected`);

            return resolve(player);
        });
    }

    /**
     * @param {string} token
     * @param {string} address
     * @param {int} udpPort
     * @returns {Promise.<Player>}
     */
    fullConnect(token, address, udpPort) {
        return this.connect(token, address, udpPort)
            .then(player => {
                const message = FlatBuffersHelper.udpReceived(player.id);
                this.sender.toPlayerTCP(player, message);

                return player;
            })
            // TODO: Stupid fix for TCP stream nature
            .then(player => new Promise(resolve => setTimeout(() => resolve(player), 50)))
            .then(player => {
                this.lobby.addPlayer(player);
                this.lifeManager.addPlayer(player);
                this.statsManager.addPlayer(player);

                return player;
            })
    }

    /**
     * @param {Player} player
     */
    disconnect(player) {
        if (player.isConnected()) {
            player.communicationHandler.close();
            this.connectedPlayers.delete(player.id);

            this.lobby.removePlayer(player);
            this.lifeManager.removePlayer(player);
            this.statsManager.removePlayer(player);

            this._onPlayersCountChanged();
        }

        this.players.delete(player.token);

        winston.log('info', `Player ${player.getInlineDetails()} disconnected`);

        this._shutdownIfNoPlayers();
    }

    deleteAll() {
        this.connectedPlayers
            .forEach(player => this.disconnect(player));

        this.players
            .forEach(player => {
                this.players.delete(player.token);
            });

        this._onPlayersCountChanged();
    }

    /**
     * @param {int} playerId
     */
    getConnectedPlayer(playerId) {
        return this.connectedPlayers.get(playerId);
    }

    /**
     * @param {int} playerId
     */
    getConnectedPlayerOrFail(playerId) {
        const player = this.connectedPlayers.get(playerId);
        if (player) {
            return player;
        }

        throw new ModelNotFoundError("player");
    }

    /**
     * Selects a team for the new player. Always try to balance teams as much as possible.
     *
     * @returns {int}
     * @private
     */
    _chooseTeam() {
        let blue = this.allConnected().filter(player => player.team === Player.TEAM_BLUE).length;
        let red = this.allConnected().filter(player => player.team === Player.TEAM_RED).length;

        if (blue > red) {
            return Player.TEAM_RED;
        }

        if (red > blue) {
            return Player.TEAM_BLUE;
        }

        return Math.random() % 2;
    }

    /**
     * @param {Player} player
     * @param {string} token
     * @private
     */
    _deleteIfNotConnected(player, token) {
        if (player.isConnected()) {
            return;
        }

        this.players.delete(token);
        debug(`Max delay between decide and connect exceeded for token: ${player.token}`);
    }

    _isFull() {
        return this.connectedPlayers.size >= MAX_PLAYERS;
    }

    _getUnoccupiedId() {
        if (this._isFull()) {
            return null;
        }

        for (let i = 1; i <= MAX_PLAYERS; ++i) {
            if (!this.connectedPlayers.has(i)) {
                return i;
            }
        }

        return null;
    }

    _shutdownIfNoPlayers() {
        if (this.connectedPlayers.size === 0) {
            this.gameManager.shutdown();
        }
    }

    _onPlayersCountChanged() {
        this.slaveSDK.playersCountChanged(this.connectedPlayers.size);
    }
};