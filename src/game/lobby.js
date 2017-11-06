const debug = require('debug')('sectord17-game:lobby');
const winston = require('winston');
const FlatBuffersHelper = include('/src/flatbuffers/helper');
const Player = require('./player');
const FlatbufferErrors = require('../errors/flatbuffer-errors');

const MIN_PLAYERS_TO_START_GAME = 2;

module.exports = exports = class Lobby {
    constructor() {
        this.init();
    }

    init() {
        /** @type {Map<int, {ready: boolean}>} */
        this.players = new Map();
    }

    use(dependencies) {
        /** @type {GameManager} */
        this.gameManager = dependencies.gameManager;

        /** @type {PlayerManager} */
        this.playerManager = dependencies.playerManager;

        /** @type {Sender} */
        this.sender = dependencies.sender;
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    inLobby(player) {
        return this.players.has(player.id);
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    addPlayer(player) {
        if (this.inLobby(player)) {
            debug(`Player ${player.getInlineDetails()} is in the lobby so cannot join again.`);
            return false;
        }

        this.players.set(player.id, {
            ready: false
        });

        this._sendRoomInfo(player);
        this._informPlayersPlayerJoined(player);

        debug(`Player ${player.getInlineDetails()} joined the lobby.`);

        return true;
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    removePlayer(player) {
        if (!this.inLobby(player)) {
            debug(`Player ${player.getInlineDetails()} is not in the lobby so cannot quit.`);
            return false;
        }

        this.players.delete(player.id);
        this._informPlayersPlayerQuit(player);

        debug(`Player ${player.getInlineDetails()} quit the lobby.`);

        return true;
    }

    /**
     * @param {Player} player
     * @param {boolean} ready
     * @returns {boolean}
     */
    changeReady(player, ready) {
        if (!this.inLobby(player)) {
            debug(`Player ${player.getInlineDetails()} is not in the lobby so cannot change ready.`);
            return false;
        }

        this.players.get(player.id).ready = ready;
        this._informPlayersPlayerChangedReadyState(player, ready);

        if (ready) {
            debug(`Player ${player.getInlineDetails()} is ready for game start.`);
        } else {
            debug(`Player ${player.getInlineDetails()} is unready for game start.`);
        }

        // Player changed ready state, but game could be already in starting state
        // That is why we should make sure it is now in preparing state
        this.gameManager.gamePreparing();
        this._tryStartGame();

        return true;
    }

    /**
     * @param {Player} player
     * @returns {boolean}
     */
    isReady(player) {
        if (!this.inLobby(player)) {
            return false;
        }

        return this.players.get(player.id).ready;
    }

    /**
     * @param {Player} player
     * @param {int} team
     */
    changeTeam(player, team) {
        if (!this._canChangeTeam(team)) {
            const message = FlatBuffersHelper.error(FlatbufferErrors.CANNOT_CHANGE_TEAM, team);
            this.sender.toPlayerViaTCP(player, message);
            return;
        }

        debug(`Player ${player.getInlineDetails()} changed team from ${player.team} to ${team}.`);
        player.team = team;
        this._informPlayersPlayerChangedTeam(player, team);
    }

    /**
     * @param {int} team
     * @returns {boolean}
     */
    _canChangeTeam(team) {
        let blue = this.playerManager.getConnectedPlayers().filter(player => player.team === Player.TEAM_BLUE).length;
        let red = this.playerManager.getConnectedPlayers().filter(player => player.team === Player.TEAM_RED).length;

        return (team === Player.TEAM_RED && blue > red) || (team === Player.TEAM_BLUE && red > blue);
    }

    _tryStartGame() {
        const playersDetails = Array.from(this.players.values());

        if (this.playerManager.getConnectedPlayers() < MIN_PLAYERS_TO_START_GAME) {
            return false;
        }

        if (!playersDetails.every(playerInfo => playerInfo.ready)) {
            return false;
        }

        winston.log('info', "Game started!");

        this.gameManager.gameStarting();

        return true;
    }

    /**
     * Send player details about connected players
     *
     * @param {Player} player
     * @private
     */
    _sendRoomInfo(player) {
        const message = FlatBuffersHelper.roomMsg.roomInfo(this.playerManager.getConnectedPlayers());
        this.sender.toPlayerViaTCP(player, message);
    }

    /**
     * Inform all players on the server that new player joined the server
     *
     * @param {Player} player
     * @private
     */
    _informPlayersPlayerJoined(player) {
        const message = FlatBuffersHelper.roomMsg.playerConnected(player.id, player.name);
        this.sender.toEveryPlayerButOneViaTCP(player, message);
    }

    /**
     * Inform all players on the server that player quit the server
     *
     * @param {Player} player
     * @private
     */
    _informPlayersPlayerQuit(player) {
        const message = FlatBuffersHelper.roomMsg.playerDisconnected(player.id);
        this.sender.toEveryPlayerButOneViaTCP(player, message);
    }

    /**
     * Inform all players on the server that player changed its ready state
     *
     * @param {Player} player
     * @param {boolean} ready
     * @private
     */
    _informPlayersPlayerChangedReadyState(player, ready) {
        const message = FlatBuffersHelper.roomMsg.playerReady(player.id, ready);
        this.sender.toEveryPlayerButOneViaTCP(player, message);
    }

    /**
     * Inform all players on the server that player changed team
     *
     * @param {Player} player
     * @param {RoomAssets.Code.Remote.Flat.Team} team
     * @private
     */
    _informPlayersPlayerChangedTeam(player, team) {
        const message = FlatBuffersHelper.roomMsg.teamChanged(player.id, team);
        this.sender.toEveryPlayerButOneViaTCP(player, message);
    }
};
