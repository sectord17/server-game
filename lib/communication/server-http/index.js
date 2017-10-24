const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const debug = require('debug')('sectord17-game:server-http');
const report = include('/lib/errors/reporter');

const BasicError = include('/lib/errors/basic-error');
const ConnectingError = include('/lib/errors/connecting-error');
const ModelNotFoundError = include('/lib/errors/model-not-found-error');
const EndpointNotFoundError = include('/lib/errors/endpoint-not-found-error');

module.exports = exports = class ServerHTTP {
    constructor(port) {
        this.app = null;
        this.server = null;
        this.port = parseInt(port) || 0;
    }

    start() {
        this.app = express();

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: false}));

        require('./routes')(this.app);

        this.app.use((req, res, next) => next(new EndpointNotFoundError()));
        this.app.use(this.errorHandler);

        this.server = this.startServer();

        return new Promise(resolve => this.server.on('listening', () => resolve()));
    }

    errorHandler(error, request, response, next) {
        if (error instanceof EndpointNotFoundError) {
            return response.sendStatus(404);
        }

        if (error instanceof ModelNotFoundError) {
            return response.sendStatus(404);
        }

        if (error instanceof BasicError) {
            return response.status(403).send(error);
        }

        if (error instanceof ConnectingError) {
            return response.status(403).send(error);
        }

        report(error);

        response.sendStatus(500);
    }

    startServer() {

        const server = http.createServer(this.app).listen(this.port);

        server.on('listening', () => {
            const address = server.address();
            debug(`Listening on ${address.address}:${address.port}`);
        });

        server.on('error', error => report(error));

        return server;
    }
};
