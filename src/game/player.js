const moment = require('moment');
const RoomAssets = include('/src/flatbuffers/RoomSchema_generated').Assets;
const InvalidArgumentError = require('../errors/invalid-argument-error');

class Player {
    static get TEAM_BLUE() {
        return RoomAssets.Code.Remote.Flat.Team.Blue;
    }

    static get TEAM_RED() {
        return RoomAssets.Code.Remote.Flat.Team.Red;
    }

    constructor(token) {
        this._token = token;
        this._id = null;
        this._name = null;
        this._decidedAt = moment();
        this._authorizedAt = null;
        this._connectedAt = null;
        this._lastActiveAt = moment();

        // Team
        this._team = null;

        // Stats
        this._points = 0;

        // Life
        this._health = 0;
        this._diedAt = null;

        /** @type {CommunicationHandler} */
        this.communicationHandler = null;
    }

    get diedAt() {
        return this._diedAt;
    }

    get health() {
        return this._health;
    }

    get points() {
        return this._points;
    }

    get team() {
        return this._team;
    }

    get lastActiveAt() {
        return this._lastActiveAt;
    }

    get connectedAt() {
        return this._connectedAt;
    }

    get authorizedAt() {
        return this._authorizedAt;
    }

    get decidedAt() {
        return this._decidedAt;
    }

    get name() {
        return this._name;
    }

    get id() {
        return this._id;
    }

    get token() {
        return this._token;
    }

    /**
     * @param {string} name
     * @param {CommunicationHandler} communicationHandler
     */
    setAuthorized(name, communicationHandler) {
        this._name = name;
        this._authorizedAt = moment();
        this.communicationHandler = communicationHandler;
    }

    /**
     * @param {int} id
     */
    setConnected(id) {
        this._id = id;
        this._connectedAt = moment();
    }

    setTeam(team) {
        if (team !== Player.TEAM_BLUE && team !== Player.TEAM_RED) {
            throw new InvalidArgumentError();
        }

        this._team = team;
    }

    setHealth(health) {
        if (health < 0) {
            throw new InvalidArgumentError();
        }

        this._health = health;
    }

    setDiedAt(date) {
        this._diedAt = date;
    }

    setPoints(points) {
        this._points = points;
    }

    setLastActiveAt(date) {
        this._lastActiveAt = date;
    }

    touch() {
        this.setLastActiveAt(moment());
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

    isAlive() {
        return this.health > 0;
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
}

module.exports = exports = Player;
