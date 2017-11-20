class Sender {
    use(dependencies) {
        /** @type {PlayerManager} */
        this.playerManager = dependencies.playerManager;
    }

    toPlayerViaTCP(player, message) {
        player.communicationHandler.sendViaTcp(message);
    }

    toPlayerViaUDP(player, message) {
        player.communicationHandler.sendViaUdp(message);
    }

    toPlayersViaTCP(players, message) {
        players.forEach(player => this.toPlayerViaTCP(player, message));
    }

    toPlayersViaUDP(players, message) {
        players.forEach(player => this.toPlayerViaUDP(player, message));
    }

    toEveryPlayerViaTCP(message) {
        this.playerManager.getConnectedPlayers().forEach(player => this.toPlayerViaTCP(player, message));
    }

    toEveryPlayerViaUDP(message) {
        this.playerManager.getConnectedPlayers().forEach(player => this.toPlayerViaUDP(player, message));
    }

    toEveryPlayerButOneViaTCP(player, message) {
        this.toPlayersViaTCP(this._everyPlayerButOne(player), message);
    }

    toEveryPlayerButOneViaUDP(player, message) {
        this.toPlayersViaUDP(this._everyPlayerButOne(player), message);
    }

    _everyPlayerButOne(player) {
        return this.playerManager
            .getConnectedPlayers()
            .filter(playerCompared => playerCompared.id !== player.id);
    }
}

module.exports = exports = Sender;
