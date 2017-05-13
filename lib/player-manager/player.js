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
     * @param {string} name
     * @param {CommunicationHandler} communicationHandler
     */
    setAuthorized(name, communicationHandler) {
        this.name = name;
        this.communicationHandler = communicationHandler;
        this.authorizedAt = moment();
    }

    /**
     * @param {int} id
     */
    setConnected(id) {
        this.id = id;
        this.connectedAt = moment();
    }

    isDecided() {
        return !!this.token;
    }

    isAuthorized() {
        return !!this.communicationHandler;
    }

    isConnected() {
        return !!this.id;
    }
};