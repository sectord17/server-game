const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const debug = require('debug')('sectord17-game:http');
const report = require('../errors/reporter');
const app = require('../../app');

const BasicError = require('../errors/basic-error');
const ModelNotFoundError = require('../errors/model-not-found-error');
const EndpointNotFoundError = require('../errors/endpoint-not-found-error');

const httpApp = express();

httpApp.use(bodyParser.json());
httpApp.use(bodyParser.urlencoded({extended: false}));

require('./routes')(app, httpApp);

httpApp.use(function (req, res, next) {
    next(new EndpointNotFoundError());
});

httpApp.use(function (error, request, response, next) {
    if (error instanceof EndpointNotFoundError) {
        return response.sendStatus(404);
    }

    if (error instanceof ModelNotFoundError) {
        return response.sendStatus(404);
    }

    if (error instanceof BasicError) {
        return response.status(403).send(error);
    }

    report(error);

    response.sendStatus(500);
});

const server = http.createServer(httpApp).listen(process.env.HTTP_PORT || 3003);

server.on('listening', () => {
    const address = server.address();
    debug(`Listening on ${address.address}:${address.port}`);
});

server.on('error', error => report(error));

module.exports = httpApp;
