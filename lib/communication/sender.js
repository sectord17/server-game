module.exports = exports = class Sender {
    constructor() {
        /** @type {PlayerManager} */
        this.playerManager = null;
    }

    use(dependencies) {
        this.playerManager = dependencies.playerManager;
    }

    toPlayerTCP(player, message) {
        player.communicationHandler.sendViaTcp(message);
    }

    toPlayerUDP(player, message) {
        player.communicationHandler.sendViaUdp(message);
    }

    toPlayersTCP(players, message) {
        players.forEach(player => this.toPlayerTCP(player, message));
    }

    toPlayersUDP(players, message) {
        players.forEach(player => this.toPlayerUDP(player, message));
    }

    toEveryPlayerTCP(message) {
        this.playerManager.allConnected().forEach(player => this.toPlayerTCP(player, message));
    }

    toEveryPlayerUDP(message) {
        this.playerManager.allConnected().forEach(player => this.toPlayerUDP(player, message));
    }

    toEveryPlayerButTCP(player, message) {
        this.toPlayersTCP(this._everyPlayerBut(player), message);
    }

    toEveryPlayerButUDP(player, message) {
        this.toPlayersUDP(this._everyPlayerBut(player), message);
    }

    _everyPlayerBut(player) {
        return this.playerManager
            .allConnected()
            .filter(playerCompared => playerCompared.id !== player.id);
    }
};
