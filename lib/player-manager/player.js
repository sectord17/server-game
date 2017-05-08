const moment = require('moment');

module.exports = class Player {
    constructor(token) {
        this.token = token;
        this.id = null;
        this.joinedAt = moment();
        this.connectedAt = null;
        this.udpConnectionHandler = null;
        this.tcpConnectionHandler = null;
    }

    setConnected(id) {
        this.id = id;
        this.connectedAt = moment();
    }
};