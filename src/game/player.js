const moment = require('moment');
const RoomAssets = include('/src/flatbuffers/RoomSchema_generated').Assets;
const InvalidArgumentError = require('../errors/invalid-argument-error');

module.exports = exports = class Player {
    static get TEAM_BLUE() {
        return RoomAssets.Code.Remote.Flat.Team.Blue;
    }

    static get TEAM_RED() {
        return RoomAssets.Code.Remote.Flat.Team.Red;
    }

    constructor(token) {
        this.token = token;
        this.decidedAt = moment();
        this.id = null;
        this.name = null;
        this.authorizedAt = null;
        this.connectedAt = null;
        this.lastActiveAt = moment();
        /** @type {CommunicationHandler} */
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

    setTeam(team) {
        if (team !== Player.TEAM_BLUE && team !== Player.TEAM_RED) {
            throw new InvalidArgumentError();
        }

        this.team = team;
    }

    touch() {
        this.lastActiveAt = moment();
    }

    isDecided() {
        return this.token !== null;
    }

    isAuthorized() {
        return this.communicationHandler !== null;
    }

    isConnected() {
        return this.id !== null;
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