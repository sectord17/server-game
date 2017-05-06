module.exports = class Player {
    constructor(token) {
        this.token = token;
        this.id = null;
        this.connected = false;
        this.connectionHandler = null;
    }
};