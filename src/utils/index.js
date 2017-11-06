const winston = require('winston');

module.exports.getValidEnv = key => {
    "use strict";
    const value = process.env[key];

    if (!value) {
        throw new Error(`No value for env [${key}]`);
    }

    return value;
};

module.exports.include = file => {
    "use strict";
    return require(__dirname + '/../..' + file);
};