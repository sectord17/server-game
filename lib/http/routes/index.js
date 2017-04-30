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
            .catch(error => response.status(403).send(error));
    });
};