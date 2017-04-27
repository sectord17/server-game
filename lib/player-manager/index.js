const uuidV4 = require('uuid/v4');
const Player = require('./player');

module.exports = function () {
    let players = [];

    let getPlayerIndexByToken = function (token) {
        for (let i = 0; i < players.length; ++i) {
            if (players[i].token === token) {
                return i;
            }
        }

        return null;
    };

    return {
        all() {
            return players.slice();
        },

        join() {
            const token = uuidV4();
            const player = new Player(token);
            players.push(player);

            return player;
        },

        connect(token) {
            let playerIndex = getPlayerIndexByToken(token);

            if (playerIndex === null) {
                return false;
            }

            let player = players[playerIndex];
            player.connected = true;

            return player;
        }
    }
};