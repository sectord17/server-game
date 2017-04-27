module.exports = function (httpApp, playerManager) {
    httpApp.post('/join', (request, response) => {
        playerManager.join()
            .then(player => response.send({token: player.token}))
            .catch(() => response.sendStatus(500));
    });
};