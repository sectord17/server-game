const uuidV4 = require('uuid/v4');
const Player = require('./player');
const CommunicationHandler = require('../game/server-tcp/communication-handler');
const ConnectingError = require('../errors/connecting-error');
const ModelNotFoundError = require('../errors/model-not-found-error');
const debug = require('debug')('sectord17-game:player-manager');
const winston = require('winston');

const MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT = 30 * 1000; // 10 seconds
const MAX_PLAYERS = 8;

class PlayerManager {
    constructor() {
        // Token => Player
        this.players = new Map();

        // Id => Player
        this.connectedPlayers = new Map();
    }

    all() {
        return Array.from(this.players.values());
    }

    allConnected() {
        return Array.from(this.connectedPlayers.values());
    }

    // Handshake flow
    // Decide -> Authorize -> Connect

    decide() {
        if (this._isFull()) {
            throw new ConnectingError("too_many_players");
        }

        const token = uuidV4();
        const player = new Player(token);
        this.players.set(token, player);

        setTimeout(() => this.players.delete(token), MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT);

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

            if (player.isConnected()) {
                return reject(new ConnectingError("already_connected"));
            }

            const id = this._getUnoccupiedId();
            if (id === null) {
                throw new ConnectingError("too_many_players", player);
            }

            player.communicationHandler.assignAddress(address, udpPort);
            player.setConnected(id);
            this.connectedPlayers.set(player.id, player);

            winston.log('info', `Player #${player.id} connected`);

            return resolve(player);
        });
    }

    /**
     * @param {Player} player
     */
    disconnect(player) {
        if (player.isConnected()) {
            player.communicationHandler.close();
        }

        this.connectedPlayers.delete(player.id);
        this.players.delete(player.token);

        winston.log('info', `Player #${player.id} disconnected`);
    }

    deleteAll() {
        this.connectedPlayers
            .forEach(player => this.disconnect(player));

        this.players
            .forEach(player => {
                this.players.delete(player.token)
            });
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

    _isFull() {
        return this.connectedPlayers.size >= MAX_PLAYERS;
    }
}

module.exports = new PlayerManager();