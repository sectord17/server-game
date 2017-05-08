const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

/**
 * @param {Player} player
 */
module.exports = (player) => {
    return {
        id: player.id,
        token: player.token,
        joinedAt: player.joinedAt ? player.joinedAt.format(DATE_FORMAT) : null,
        connectedAt: player.connectedAt ? player.connectedAt.format(DATE_FORMAT) : null,
        udpConnectionHandler: !!player.udpConnectionHandler,
        tcpConnectionHandler: !!player.tcpConnectionHandler,
    }
};