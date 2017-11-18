const {formatDateTime} = require('../utils');

/**
 * @param {Player} player
 */
module.exports = player => {
    const {lobby} = include('/src');

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
            health: player.health,
            diedAt: formatDateTime(player.diedAt),
        },
        decidedAt: formatDateTime(player.decidedAt),
        authorizedAt: formatDateTime(player.authorizedAt),
        connectedAt: formatDateTime(player.connectedAt),
        lastActiveAt: formatDateTime(player.lastActiveAt)
    };

    if (player.communicationHandler) {
        response.communicationHandler = {
            address: player.communicationHandler.address,
            udpPort: player.communicationHandler.udpPort,
        };
    }

    return response;
};