const env = require('node-env-file');
const raven = require('raven');
const winston = require('winston');

env(__dirname + '/.env');

if (process.env.SENTRY_DSN) {
    raven.config(process.env.SENTRY_DSN).install();
}

winston.level = 'debug';

require('./lib');
