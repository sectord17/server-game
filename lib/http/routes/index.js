const BasicError = require('../../errors/basic-error');

module.exports = function (httpApp, playerManager) {
    httpApp.get('/admin/players', (request, response) => {
        response.send(playerManager.all());
    });

    httpApp.get('/admin/pending-players', (request, response) => {
        response.send(playerManager.allPending());
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