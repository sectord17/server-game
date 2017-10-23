const moment = require('moment');
const RoomAssets = include('/lib/flatbuffers/RoomSchema_generated').Assets;

const TEAM_RED = RoomAssets.Code.Remote.Flat.Team.Red;
const TEAM_BLUE = RoomAssets.Code.Remote.Flat.Team.Blue;

module.exports = exports = class Player {
    constructor(token, team) {
        this.token = token;
        this.team = team;
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

    getInlineDetails() {
        // Nickname <1, 127.0.0.1:21323>
        if (this.isConnected()) {
            return `${this.name} <${this.id}, ${this.communicationHandler.address}:${this.communicationHandler.udpPort}>`;
        }

        // Nickname
        if (this.isAuthorized()) {
            return `${this.name}`;
        }

        // [asdasfasfasf]
        return `[${this.token}]`;
    }
};