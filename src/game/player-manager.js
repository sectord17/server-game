const uuidV4 = require('uuid/v4');
const debug = require('debug')('sectord17-game:player-manager');
const winston = require('winston');
const Player = require('./player');
const CommunicationHandler = include('/src/communication/server-tcp/communication-handler');
const ConnectingError = include('/src/errors/connecting-error');
const ModelNotFoundError = include('/src/errors/model-not-found-error');
const FlatBuffersHelper = include('/src/flatbuffers/helper');

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
        this.MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT = 5 * 1000;
        this.MAX_PLAYERS = 8 * 1000;

        this.gameManager = gameManager;
        this.lifeManager = lifeManager;
        this.statsManager = statsManager;
        this.lobby = lobby;
        this.sender = sender;
        this.slaveSDK = slaveSDK;
        this.init();
    }

    init() {
        // Token => Player
        this.players = new Map();

        // Id => Player
        this.connectedPlayers = new Map();
    }

    /**
     * @returns {Array.<Player>}
     */
    getPlayers() {
        return Array.from(this.players.values());
    }

    /**
     * @returns {Array.<Player>}
     */
    getConnectedPlayers() {
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

        const player = new Player(token);
        this.players.set(token, player);

        setTimeout(() => this._deleteIfNotConnected(player), this.MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT);

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
        return this._register(token, address, udpPort)
            .then(player => {
                const message = FlatBuffersHelper.udpReceived(player.id);
                this.sender.toPlayerViaTCP(player, message);
                this.lobby.addPlayer(player);

                return player;
            });
    }

    /**
     * @param {string} token
     * @param {string} address
     * @param {int} udpPort
     * @returns {Promise.<Player>}
     */
    _register(token, address, udpPort) {
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
                return reject(new ConnectingError("too_many_players", player));
            }

            const team = this._chooseTeam();

            player.communicationHandler.assignAddress(address, udpPort);
            player.setConnected(id);
            player.setTeam(team);

            this.connectedPlayers.set(player.id, player);
            this.lifeManager.addPlayer(player);
            this.statsManager.addPlayer(player);
            this._onPlayersCountChanged();

            winston.log('info', `Player ${player.getInlineDetails()} connected`);

            return resolve(player);
        });
    }

    /**
     * @param {Player} player
     */
    disconnect(player) {
        this.players.delete(player.token);

        if (player.isAuthorized()) {
            player.communicationHandler.close();
        }

        if (player.isConnected()) {
            this.connectedPlayers.delete(player.id);

            this.lobby.removePlayer(player);
            this.lifeManager.removePlayer(player);
            this.statsManager.removePlayer(player);

            this._onPlayersCountChanged();
        }

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
        let blue = this.getConnectedPlayers().filter(player => player.team === Player.TEAM_BLUE).length;
        let red = this.getConnectedPlayers().filter(player => player.team === Player.TEAM_RED).length;

        if (blue > red) {
            return Player.TEAM_RED;
        }

        if (red > blue) {
            return Player.TEAM_BLUE;
        }

        return Math.floor(Math.random() * 2);
    }

    /**
     * @param {Player} player
     * @private
     */
    _deleteIfNotConnected(player) {
        if (!player.isConnected()) {
            this.disconnect(player);
            debug(`Max delay between decide and connect exceeded for token: ${player.token}`);
        }
    }

    _isFull() {
        return this.connectedPlayers.size >= this.MAX_PLAYERS;
    }

    _getUnoccupiedId() {
        if (this._isFull()) {
            return null;
        }

        for (let i = 1; i <= this.MAX_PLAYERS; ++i) {
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