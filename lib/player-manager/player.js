const moment = require('moment');

module.exports = class Player {
    constructor(token) {
        this.token = token;
        this.id = null;
        this.joinedAt = moment();
        this.enteredAt = null;
        this.communicationHandler = null;
    }

    /**
     * @param {int} id
     */
    assignId(id) {
        this.id = id;
    }

    /**
     * @param {CommunicationHandler} communicationHandler
     */
    setEntered(communicationHandler) {
        this.communicationHandler = communicationHandler;
        this.enteredAt = moment();
    }

    isEntered() {
        return !!this.communicationHandler;
    }
};