const moment = require('moment');

module.exports = class Player {
    constructor(token) {
        this.token = token;
        this.id = null;
        this.joinedAt = moment();
        this.connectedAt = null;
        this.connectionHandlerTcp = null;
        this.connectionHandlerUdp = null;
    }

    setConnected(id) {
        this.id = id;
        this.connectedAt = moment();
    }

    setConnectedViaTcp(connectionHandlerTcp) {
        this.connectionHandlerTcp = connectionHandlerTcp;

        console.log(`Player #${this.id} connected via TCP`);
    }

    setConnectedViaUdp(connectionHandlerUdp) {
        this.connectionHandlerTcp = connectionHandlerUdp;

        console.log(`Player #${this.id} connected via UDP`);
    }
};