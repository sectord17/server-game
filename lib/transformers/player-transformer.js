const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

/**
 * @param {Player} player
 */
module.exports = (player) => {
    return {
        id: player.id,
        token: player.token,
        joinedAt: player.joinedAt ? player.joinedAt.format(DATE_FORMAT) : null,
        enteredAt: player.enteredAt ? player.enteredAt.format(DATE_FORMAT) : null
    }
};