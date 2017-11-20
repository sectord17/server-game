const Player = require('./player');

class TeamManager {
    use(dependencies) {
        /** @type {PlayerManager} */
        this.playerManager = dependencies.playerManager;
    }

    /**
     * @param {Player} player
     */
    assignToTeam(player) {
        const team = this._chooseTeam();
        player.setTeam(team);
    }

    /**
     * Selects a team for the new player. Always try to balance teams as much as possible.
     *
     * @returns {int}
     * @private
     */
    _chooseTeam() {
        const players = this.playerManager.getConnectedPlayers();
        const blue = players.filter(player => player.team === Player.TEAM_BLUE).length;
        const red = players.filter(player => player.team === Player.TEAM_RED).length;

        if (blue > red) {
            return Player.TEAM_RED;
        }

        if (red > blue) {
            return Player.TEAM_BLUE;
        }

        return Math.floor(Math.random() * 2);
    }
}

module.exports = exports = TeamManager;
