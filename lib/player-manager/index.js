const uuidV4 = require('uuid/v4');
const Player = require('./player');
const BasicError = require('../errors/basic-error');

module.exports = function () {
    const MAX_PLAYERS = 8;
    const players = new Map();
    const pendingPlayers = new Map();

    const getUnoccupiedId = function () {
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

    const isFull = function () {
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

                return resolve(player);
            });
        },

        connect(token) {
            return new Promise((resolve, reject) => {
                if (!pendingPlayers.has(token)) {
                    return reject(new BasicError("invalid_token"));
                }

                const id = getUnoccupiedId();
                if (id === null) {
                    return reject(new BasicError("too_many_players"));
                }

                const player = pendingPlayers.get(token);
                player.id = id;
                player.connected = true;

                players.set(id, player);
                pendingPlayers.delete(token);

                return resolve(player);
            });
        },

        disconnect(player) {
            players.delete(player.id);
        }
    }
};