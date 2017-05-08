const raven = require('raven');

module.exports = error => {
    if (process.env.SENTRY_DSN) {
        raven.captureException(error);
    }

    console.log(error);
};