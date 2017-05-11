const moment = require('moment');

module.exports = class Player {
    constructor(token) {
        this.token = token;
        this.decidedAt = moment();
        this.id = null;
        this.name = null;
        this.authorizedAt = null;
        this.connectedAt = null;
        this.communicationHandler = null;
    }

    /**
     * @param {int} id
     * @param {string} name
     */
    setAuthorized(id, name) {
        this.id = id;
        this.name = name;
        this.authorizedAt = moment();
    }

    /**
     * @param {CommunicationHandler} communicationHandler
     */
    setConnected(communicationHandler) {
        this.communicationHandler = communicationHandler;
        this.connectedAt = moment();
    }

    isDecided() {
        return !!this.token;
    }

    isAuthorized() {
        return !!this.id;
    }

    isConnected() {
        return !!this.communicationHandler;
    }
};