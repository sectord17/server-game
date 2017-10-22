const transformPlayer = include('/lib/transformers/player-transformer');

module.exports = app => {
    const {playerManager} = include('/lib');

    // Authorize every request
    const token = process.env.TOKEN;
    app.use((request, response, next) => {
        if (token !== request.headers.authorization) {
            return response.sendStatus(401);
        }

        next();
    });

    app.get('/admin/players', (request, response) => {
        const players = playerManager.all()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    app.get('/admin/connected-players', (request, response) => {
        const players = playerManager.allConnected()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    app.delete('/admin/connected-players/:playerId', (request, response) => {
        const player = playerManager.getConnectedPlayerOrFail(request.params.playerId);

        playerManager.disconnect(player);

        response.sendStatus(200);
    });

    app.post('/decide', (request, response) => {
        const player = playerManager.decide();

        response.send({
            token: player.token
        });
    });
};