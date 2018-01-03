const transformPlayer = include('/src/transformers/player-transformer');
const config = require('../../config');

module.exports = exports = app => {
    const {playerManager, gameManager} = include('/src');

    // Authorize every request
    const token = config.get('TOKEN');
    app.use((request, response, next) => {
        if (token !== request.headers.authorization) {
            return response.sendStatus(401);
        }

        next();
    });

    /**
     * @api {get} /admin/players Get list of players
     * @apiVersion 0.0.1
     * @apiGroup Admin
     *
     * @apiExample {json} Request:
     *      GET /admin/players
     *
     * @apiSuccessExample Success-Response:
     *      HTTP/1.1 200 OK
     *      [
     *          {
     *              id: 1,
     *              name: 'Test',
     *              token: '1111-1111-1111-1111',
     *              communicationHandler: null,
     *              lobby: {
     *                  joined: false,
     *                  ready: false
     *              },
     *              life: {
     *                  health: 0,
     *                  diedAt: null
     *              },
     *              decidedAt: '2018-01-01 20:00:00:34',
     *              authorizedAt: null,
     *              connectedAt: null,
     *              lastActiveAt: null
     *          }
     *      ]
     */
    app.get('/admin/players', (request, response) => {
        const players = playerManager.getPlayers()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    /**
     * @api {get} /admin/players Get list of connected players
     * @apiVersion 0.0.1
     * @apiGroup Admin
     *
     * @apiExample {json} Request:
     *      GET /admin/players
     *
     * @apiSuccessExample Success-Response:
     *      HTTP/1.1 200 OK
     *      [
     *          {
     *              id: 1,
     *              name: 'Test',
     *              token: '1111-1111-1111-1111',
     *              communicationHandler: {
     *                  address: '192.0.2.3',
     *                  udpPort: 8000
     *              },
     *              lobby: {
     *                  joined: true,
     *                  ready: true
     *              },
     *              life: {
     *                  health: 80,
     *                  diedAt: '2018-01-01 20:00:10:34'
     *              },
     *              decidedAt: '2018-01-01 20:00:00:34',
     *              authorizedAt: '2018-01-01 20:00:00:54',
     *              connectedAt: '2018-01-01 20:00:00:64',
     *              lastActiveAt: '2018-01-01 20:00:11:34'
     *          }
     *      ]
     */
    app.get('/admin/connected-players', (request, response) => {
        const players = playerManager.getConnectedPlayers()
            .map(player => transformPlayer(player));

        response.send(players);
    });

    /**
     * @api {delete} /admin/players/:player Disconnect player
     * @apiVersion 0.0.1
     * @apiGroup Admin
     *
     * @apiExample {json} Request:
     *      DELETE /admin/players/1
     *
     * @apiSuccessExample Success-Response:
     *      HTTP/1.1 200 OK
     */
    app.delete('/admin/connected-players/:playerId', (request, response) => {
        const player = playerManager.getConnectedPlayerOrFail(request.params.playerId);

        playerManager.disconnect(player);

        response.sendStatus(200);
    });

    /**
     * @api {post} /decision Decide to join the server
     * @apiVersion 0.0.1
     * @apiGroup Internal
     *
     * @apiExample {json} Request:
     *      POST /decision
     *
     * @apiSuccessExample Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          token: '1111-1111-1111-1111'
     *      }
     */
    app.post('/decision', (request, response) => {
        const player = playerManager.decide();

        response.send({
            token: player.token
        });
    });

    /**
     * @api {post} /shutdown Shutdown the server
     * @apiVersion 0.0.1
     * @apiGroup Internal
     *
     * @apiExample {json} Request:
     *      POST /shutdown
     *
     * @apiSuccessExample Success-Response:
     *      HTTP/1.1 200 OK
     */
    app.post('/shutdown', (request, response) => {
        response.sendStatus(200);
        gameManager.gameFinish();
    });
};
