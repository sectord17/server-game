const transformPlayer = require('./transformers/player-transformer');
const app = require('../app');

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    let args = input.split(' ');

    if (args.length < 1) {
        return;
    }

    if (args[0] === 'list-connectedPlayers') {
        return console.log(
            app.playerManager
                .allConnected()
                .map(player => transformPlayer(player))
        );
    }
});

module.exports = rl;