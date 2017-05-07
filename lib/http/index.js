module.exports = function (app) {
    let express = require('express'),
        bodyParser = require('body-parser'),
        httpApp = express(),
        raven = require('raven'),
        debug = require('debug')('sectord17-game:http'),
        http = require('http');

    const BasicError = require('../errors/basic-error');
    const EndpointNotFoundError = require('../errors/endpoint-not-found-error');

    httpApp.use(bodyParser.json());
    httpApp.use(bodyParser.urlencoded({extended: false}));

    require('./routes')(httpApp, app.playerManager);

    httpApp.use(function (req, res, next) {
        next(new EndpointNotFoundError());
    });

    httpApp.use(function (error, request, response, next) {
        if (error instanceof EndpointNotFoundError) {
            return response.sendStatus(404);
        }

        if (error instanceof BasicError) {
            return response.status(403).send(error);
        }

        if (process.env.SENTRY_DSN) {
            raven.captureException(error);
        }

        response.sendStatus(500);
    });

    let server = http.createServer(httpApp);
    server.listen(process.env.HTTP_PORT || 3003);

    server.on('error', (error) => {
        if (error.syscall !== 'listen') {
            throw error;
        }

        let bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    });

    server.on('listening', () => {
        let addr = server.address();
        let bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
    });

    return httpApp;
};