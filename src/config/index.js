const {getValidEnv} = require('../utils');

module.exports = exports = {
    custom: {},

    get(key) {
        return this.custom[key] || getValidEnv(key);
    },

    set(key, value) {
        this.custom[key] = value;
    }
};
