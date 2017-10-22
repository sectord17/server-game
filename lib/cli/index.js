const readline = require('readline');
const {playerManager} = include('/lib');
const transformPlayer = include('/lib/transformers/player-transformer');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    const args = input.split(' ');

    if (args.length < 1) {
        return;
    }

    if (args[0] === 'list-connected-players') {
        return console.log(
            playerManager.allConnected().map(player => transformPlayer(player))
        );
    }
});

module.exports = rl;