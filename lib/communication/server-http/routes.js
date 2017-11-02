const transformPlayer = include('/lib/transformers/player-transformer');
const config = require('../../config');

module.exports = app => {
    const {playerManager, gameManager} = include('/lib');

    // Authorize every request
    const token = config.get('TOKEN');
    app.use((request, response, next) => {
        if (token !== request.headers.authorization) {
            return response.sendStatus(401);
        }

        next();
    });

    app.get('/admin/players', (request, response) => {
        const players = playerManager.getPlayers()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    app.get('/admin/connected-players', (request, response) => {
        const players = playerManager.getConnectedPlayers()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    app.delete('/admin/connected-players/:playerId', (request, response) => {
        const player = playerManager.getConnectedPlayerOrFail(request.params.playerId);

        playerManager.disconnect(player);

        response.sendStatus(200);
    });

    app.post('/decision', (request, response) => {
        const player = playerManager.decide();

        response.send({
            token: player.token
        });
    });

    app.post('/shutdown', (request, response) => {
        response.sendStatus(200);
        gameManager.shutdown();
    });
};