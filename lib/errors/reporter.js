const raven = require('raven');
const winston = require('winston');

module.exports = error => {
    if (process.env.SENTRY_DSN) {
        raven.captureException(error);
    }

    winston.log('error', error);
};