const uuidV4 = require('uuid/v4');
const Player = require('./player');
const CommunicationHandler = require('../game/server-tcp/communication-handler');
const BasicError = require('../errors/basic-error');
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

    decide() {
        if (this._isFull()) {
            throw new BasicError("too_many_players");
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
     * @returns {Promise.<Player>}
     */
    authorize(token, name) {
        return new Promise((resolve, reject) => {
            const player = this.players.get(token);
            if (!player) {
                return reject(new BasicError("invalid_token"));
            }

            if (player.isAuthorized()) {
                return reject(new BasicError("already_authorized"));
            }

            const id = this._getUnoccupiedId();
            if (id === null) {
                throw new BasicError("too_many_players");
            }

            player.setAuthorized(id, name);

            return resolve(player);
        });
    }

    /**
     * @param {string} token
     * @param {string} name
     * @param {string} address
     * @param {int} udpPort
     * @param {ConnectionHandler} connectionHandler
     * @returns {Promise.<Player>}
     */
    connect(token, name, address, udpPort, connectionHandler) {
        // TODO: Get rid of unnecessary promises
        return this.authorize(token, name)
            .then(player => {
                if (player.isConnected()) {
                    throw new BasicError("already_connected");
                }

                const communicationHandler = new CommunicationHandler(player, address, udpPort, connectionHandler);

                player.setConnected(communicationHandler);
                this.connectedPlayers.set(player.id, player);

                winston.log('info', `Player #${player.id} connected`);

                return player;
            });
    }

    /**
     * @param {int|Player} player
     */
    disconnect(player) {
        player = this._getConnectedPlayerOrFail(player);

        player.communicationHandler.close();
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
     * @param {int|Player} player
     */
    _getConnectedPlayerOrFail(player) {
        if (!player instanceof Player) {
            const player = this.connectedPlayers.get(player);
        }

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