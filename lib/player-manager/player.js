const moment = require('moment');

module.exports = class Player {
    constructor(token) {
        this.token = token;
        this.id = null;
        this.joinedAt = moment().format();
        this.connectedAt = null;
        this.connectionHandler = null;
    }

    setConnected(id) {
        this.id = id;
        this.connectedAt = moment().format();
    }
};