module.exports = function (httpApp, playerManager) {
    httpApp.get('/admin/players', (request, response) => {
        response.send(playerManager.all());
    });

    httpApp.post('/join', (request, response) => {
        const player = playerManager.join();

        response.send({
            token: player.token
        });
    });
};