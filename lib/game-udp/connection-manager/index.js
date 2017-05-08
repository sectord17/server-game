const ConnectionHandler = require('./connection-handler');
const debug = require('debug')('sectord17-game:udp-connection-manager');
const MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE = 1000; // 1 seconds

module.exports = class ConnectionManager {
    constructor(server, playerManager) {
        this.server = server;
        this.playerManager = playerManager;
        this.connectionHandlers = new Map();
    }

    onMessage(message, rinfo) {
        this._findOrCreate(rinfo).onMessage(message);
    }

    sendToEachPlayer(message, filterPlayers) {
        let players = this.playerManager.all()
            .filter(player => player.udpConnectionHandler);

        if (filterPlayers) {
            players = players.filter(filterPlayers);
        }

        players.forEach(player => {
            const rinfo = player.udpConnectionHandler.rinfo;

            this.server.send(message, 0, message.length, rinfo.port, rinfo.address);
        });
    }

    /**
     * @param rinfo
     * @returns {ConnectionHandler}
     */
    _findOrCreate(rinfo) {
        const key = ConnectionManager.makeKey(rinfo);
        const connectionHandler = this.connectionHandlers.get(key);

        if (connectionHandler) {
            return connectionHandler;
        }

        return this._create(rinfo);
    }

    /**
     * @param rinfo
     * @returns {ConnectionHandler}
     */
    _create(rinfo) {
        const key = ConnectionManager.makeKey(rinfo);
        const connectionHandler = new ConnectionHandler(rinfo, this.playerManager, this);

        this.connectionHandlers.set(key, connectionHandler);

        // Remove connection if not authorized within n seconds since connection
        setTimeout(() => {
            if (!connectionHandler.isAuthorized()) {
                this._destroy(key);
                debug("Connection removed because of lack of authorization");
            }
        }, MAX_DELAY_BETWEEN_CONNECT_AND_AUTHORIZE);

        return connectionHandler;
    }

    _destroy(key) {
        this.connectionHandlers.delete(key);
    }

    static makeKey(rinfo) {
        return `${rinfo.address}:${rinfo.port}`;
    }
};