const uuidV4 = require('uuid/v4');
const Player = require('./player');
const CommunicationHandler = require('../../communication/server-tcp/communication-handler');
const ConnectingError = require('../../errors/connecting-error');
const ModelNotFoundError = require('../../errors/model-not-found-error');
const FlatBuffersHelper = require('../../flatbuffers/helper');
const debug = require('debug')('sectord17-game:player-manager');
const winston = require('winston');

const MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT = 5 * 1000; // 5 seconds
const MAX_PLAYERS = 8;

class PlayerManager {
    constructor() {
        this.lobby = require('../lobby');

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

        setTimeout(() => {
            if (!player.isConnected()) {
                this.players.delete(token);
                debug(`Max delay between decide and connect exceeded for token: ${player.token}`);
            }
        }, MAX_DELAY_BETWEEN_DECIDE_AND_CONNECT);

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
                player.communicationHandler.sendViaTcp(FlatBuffersHelper.udpReceived(player.id));
                return player;
            })
            // TODO: Stupid fix for TCP stream nature
            .then(player => new Promise(resolve => setTimeout(() => {
                this.lobby.join(player);
                resolve(player);
            }, 2)));
    }

    /**
     * @param {Player} player
     */
    disconnect(player) {
        if (player.isConnected()) {
            player.communicationHandler.close();
            this.connectedPlayers.delete(player.id);
            this.lobby.quit(player);
        }

        this.players.delete(player.token);

        winston.log('info', `Player ${player.getInlineDetails()} disconnected`);
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