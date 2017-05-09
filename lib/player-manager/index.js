const uuidV4 = require('uuid/v4');
const Player = require('./player');
const CommunicationHandler = require('../game/server-tcp/communication-handler');
const BasicError = require('../errors/basic-error');
const ModelNotFoundError = require('../errors/model-not-found-error');
const debug = require('debug')('sectord17-game:player-manager');
const app = require('../../app');

const MAX_DELAY_BETWEEN_JOIN_AND_CONNECT = 30 * 1000; // 10 seconds
const MAX_PLAYERS = 8;

module.exports = class PlayerManager {
    constructor() {
        this.players = new Map();
        this.pendingPlayers = new Map();
    }

    all() {
        return Array.from(this.players.values());
    }

    allPending() {
        return Array.from(this.pendingPlayers.values());
    }

    join() {
        return new Promise((resolve, reject) => {
            if (this._isFull()) {
                return reject(new BasicError("too_many_players"));
            }

            const token = uuidV4();
            const player = new Player(token);
            this.pendingPlayers.set(token, player);

            setTimeout(() => this.pendingPlayers.delete(token), MAX_DELAY_BETWEEN_JOIN_AND_CONNECT);

            return resolve(player);
        });
    }

    /**
     * @returns {Promise.<Player>}
     */
    authorize(token) {
        return new Promise((resolve, reject) => {
            const player = this.pendingPlayers.get(token);
            if (!player) {
                return reject(new BasicError("invalid_token"));
            }

            if (player.enteredAt) {
                return reject(new BasicError("already_connected"));
            }

            if (this._isFull()) {
                return reject(new BasicError("too_many_players"));
            }

            const id = this._getUnoccupiedId();
            if (id === null) {
                throw new BasicError("too_many_players");
            }

            player.assignId(id);

            return resolve(player);
        });
    }

    /**
     * @param {string} token
     * @param {string} address
     * @param {int} udpPort
     * @param {ConnectionHandler} connectionHandler
     * @returns {Promise.<Player>}
     */
    enter(token, address, udpPort, connectionHandler) {
        // TODO: Figure out gr8 glow
        // As for now: join -> authorize -> enter

        return this.authorize(token)
            .then(player => {
                const communicationHandler = new CommunicationHandler(
                    player, address, udpPort, connectionHandler, this, app.gameApp.serverUdp
                );

                player.setEntered(communicationHandler);
                this.players.set(player.id, player);
                this.pendingPlayers.delete(player.token);

                console.log(`Player #${player.id} entered`);

                return player;
            });
    }

    /**
     * @param {int|Player} player
     */
    disconnect(player) {
        player = this._getPlayerOrFail(player);

        player.communicationHandler.close();

        this.players.delete(player.id);

        console.log(`Player #${player.id} disconnected`);
    }

    /**
     * @param {int|Player} player
     */
    _getPlayerOrFail(player) {
        if (!player instanceof Player) {
            const player = this.players.get(player);
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
            if (!this.players.has(i)) {
                return i;
            }
        }

        return null;
    }

    _isFull() {
        return this.players.size >= MAX_PLAYERS;
    }
};