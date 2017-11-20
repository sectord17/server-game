const readline = require('readline');
const {playerManager} = include('/src');
const transformPlayer = include('/src/transformers/player-transformer');

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
            playerManager.getConnectedPlayers().map(player => transformPlayer(player))
        );
    }
});

module.exports = exports = rl;