const winston = require('winston');

module.exports.getValidEnv = key => {
    "use strict";
    const value = process.env[key];

    if (!value) {
        winston.log('error', `No value for env [${key}]`);
        process.exit();
    }

    return value;
};

module.exports.include = file => {
    "use strict";
    return require(__dirname + '/../..' + file);
};