const uuidV4 = require('uuid/v4');
const Player = require('./player');
const BasicError = require('../errors/basic-error');
const ModelNotFoundError = require('../errors/model-not-found-error');
const debug = require('debug')('sectord17-game:player-manager');

const MAX_DELAY_BETWEEN_JOIN_AND_CONNECT = 30 * 1000; // 10 seconds
const MAX_PLAYERS = 8;

module.exports = function (app) {
    const players = new Map();
    const pendingPlayers = new Map();

    const getUnoccupiedId = () => {
        if (isFull()) {
            return null;
        }

        for (let i = 1; i <= MAX_PLAYERS; ++i) {
            if (!players.has(i)) {
                return i;
            }
        }

        return null;
    };

    const isFull = () => {
        return players.size >= MAX_PLAYERS;
    };

    return {
        all() {
            return Array.from(players.values());
        },

        allPending() {
            return Array.from(pendingPlayers.values());
        },

        join() {
            return new Promise((resolve, reject) => {
                if (isFull()) {
                    return reject(new BasicError("too_many_players"));
                }

                const token = uuidV4();
                const player = new Player(token);
                pendingPlayers.set(token, player);

                setTimeout(() => pendingPlayers.delete(token), MAX_DELAY_BETWEEN_JOIN_AND_CONNECT);

                return resolve(player);
            });
        },

        /**
         * @param {string} token
         * @returns {Promise.<Player>}
         */
        connect(token) {
            return new Promise((resolve, reject) => {
                const player = pendingPlayers.get(token);
                if (!player) {
                    return reject(new BasicError("invalid_token"));
                }

                if (player.connectedAt) {
                    return reject(new BasicError("already_connected"));
                }

                if (isFull()) {
                    return reject(new BasicError("too_many_players"));
                }

                return resolve(player);
            });
        },

        /**
         * @param {Player} player
         * @returns {Player}
         */
        tryToMakeConnected(player) {
            if (!player.connectionHandlerTcp || !player.connectionHandlerUdp) {
                return player;
            }

            const id = getUnoccupiedId();
            if (id === null) {
                throw new BasicError("too_many_players");
            }

            player.setConnected(id);

            players.set(player.id, player);
            pendingPlayers.delete(player.token);

            console.log(`Player #${player.id} connected`);

            return player;
        },

        /**
         * @param {int} playerId
         */
        disconnect(playerId) {
            const player = players.get(playerId);
            if (!player) {
                throw new ModelNotFoundError("player");
            }

            app.gameApp.connectionManagerUdp.disconnect(player.connectionHandlerUdp);
            player.connectionHandlerTcp.disconnect();

            players.delete(player.id);

            console.log(`Player #${player.id} disconnected`);
        }
    }
};