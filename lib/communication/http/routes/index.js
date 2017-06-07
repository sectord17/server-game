const transformPlayer = require('../../../transformers/player-transformer');
const playerManager = require('../../../game/player-manager');

module.exports = httpApp => {
    // Authorize every request
    const token = process.env.TOKEN;
    httpApp.use((request, response, next) => {
        if (token !== request.headers.authorization) {
            return response.sendStatus(401);
        }

        next();
    });

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
        const player = playerManager.getConnectedPlayerOrFail(request.params.playerId);

        playerManager.disconnect(player);

        response.sendStatus(200);
    });

    httpApp.post('/decide', (request, response) => {
        const player = playerManager.decide();

        response.send({
            token: player.token
        });
    });
};