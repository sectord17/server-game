const transformPlayer = require('../../transformers/player-transformer');
const playerManager = require('../../player-manager');

module.exports = function (httpApp) {
    httpApp.get('/admin/players', (request, response) => {
        const players = playerManager.all()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    httpApp.get('/admin/connected-players', (request, response) => {
        const players = playerManager.allConnected()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    httpApp.delete('/admin/connected-players/:playerId', (request, response) => {
        playerManager.disconnect(request.params.playerId);

        response.sendStatus(200);
    });

    /**
     * @depracated
     */
    httpApp.post('/join', (request, response) => {
        const player = playerManager.decide();

        response.send({
            token: player.token
        });
    });

    httpApp.post('/decide', (request, response) => {
        const player = playerManager.decide();

        response.send({
            token: player.token
        });
    });
};