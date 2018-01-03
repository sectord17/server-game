const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss:SSS";

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

module.exports.fomatDateTime = date => {
    return date ? date.format(DATETIME_FORMAT) : null;
};
