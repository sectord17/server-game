const transformPlayer = require('../../transformers/player-transformer');

module.exports = function (app, httpApp) {
    httpApp.get('/admin/players', (request, response) => {
        const players = app.playerManager
            .all()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    httpApp.get('/admin/connected-players', (request, response) => {
        const players = app.playerManager
            .allConnected()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    httpApp.delete('/admin/connected-players/:playerId', (request, response) => {
        app.playerManager.disconnect(request.params.playerId);

        response.sendStatus(200);
    });

    /**
     * @depracated
     */
    httpApp.post('/join', (request, response) => {
        const player = app.playerManager.decide();

        response.send({
            token: player.token
        });
    });

    httpApp.post('/decide', (request, response) => {
        const player = app.playerManager.decide();

        response.send({
            token: player.token
        });
    });
};