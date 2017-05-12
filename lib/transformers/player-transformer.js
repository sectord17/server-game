const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss:SSS";

/**
 * @param {Player} player
 */
module.exports = player => {
    let response = {
        id: player.id,
        name: player.name,
        token: player.token,
        decidedAt: player.decidedAt ? player.decidedAt.format(DATE_FORMAT) : null,
        authorizedAt: player.authorizedAt ? player.authorizedAt.format(DATE_FORMAT) : null,
        connectedAt: player.connectedAt ? player.connectedAt.format(DATE_FORMAT) : null
    };

    if (player.communicationHandler) {
        response.communicationHandler = {
            address: player.communicationHandler.address,
            udpPort: player.communicationHandler.udpPort,
        };
    }

    return response;
};