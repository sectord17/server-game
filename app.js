const env = require('node-env-file');
const raven = require('raven');

env(__dirname + '/.env');

if (process.env.SENTRY_DSN) {
    raven.config(process.env.SENTRY_DSN).install();
}

module.exports = require('./lib');