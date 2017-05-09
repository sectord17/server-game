const express = require('express');
const env = require('node-env-file');
const raven = require('raven');
const path = require('path');
const logger = require('morgan');

env(__dirname + '/.env');

if (process.env.SENTRY_DSN) {
    raven.config(process.env.SENTRY_DSN).install();
}

const app = express();

app.use(logger('dev'));
require('./lib')(app);

module.exports = app;