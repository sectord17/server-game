const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss:SSS";

/**
 * @param {Player} player
 */
module.exports = player => {
    const {lobby, lifeManager} = include('/src');

    const diedAt = lifeManager.getDiedAt(player);

    let response = {
        id: player.id,
        name: player.name,
        token: player.token,
        communicationHandler: null,
        lobby: {
            joined: lobby.inLobby(player),
            ready: lobby.isReady(player)
        },
        life: {
            health: lifeManager.getHealth(player),
            diedAt: diedAt ? diedAt.format(DATE_FORMAT) : null,
        },
        decidedAt: player.decidedAt ? player.decidedAt.format(DATE_FORMAT) : null,
        authorizedAt: player.authorizedAt ? player.authorizedAt.format(DATE_FORMAT) : null,
        connectedAt: player.connectedAt ? player.connectedAt.format(DATE_FORMAT) : null,
        lastActiveAt: player.lastActiveAt.format(DATE_FORMAT)
    };

    if (player.communicationHandler) {
        response.communicationHandler = {
            address: player.communicationHandler.address,
            udpPort: player.communicationHandler.udpPort,
        };
    }

    return response;
};