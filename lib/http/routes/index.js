const BasicError = require('../../errors/basic-error');
const transformPlayer = require('../../transformers/player-transformer');

module.exports = function (httpApp, playerManager) {
    httpApp.get('/admin/players', (request, response) => {
        const players = playerManager.all()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    httpApp.get('/admin/pending-players', (request, response) => {
        const players = playerManager.allPending()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    httpApp.post('/join', (request, response) => {
        playerManager.join()
            .then(player => response.send({
                token: player.token
            }))
            .catch(error => {
                if (error instanceof BasicError) {
                    return response.status(403).send(error);
                }

                throw error;
            });
    });
};