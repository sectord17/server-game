const flatbuffers = require('flatbuffers').flatbuffers;
const ServerAssets = require('../../flatbuffers/ServerSchema_generated').Assets;
const ConnectionHandler = require('./connection-handler');
const debug = require('debug')('sectord17-game:udp-connection-manager');

module.exports = class ConnectionManager {
    constructor(server, playerManager) {
        this.server = server;
        this.playerManager = playerManager;
        this.connectionHandlers = new Map();
    }

    onMessage(message, rinfo) {
        const connectionHandler = this.connectionHandlers.get(ConnectionManager.makeKey(rinfo));
        if (connectionHandler) {
            return connectionHandler.onMessage(message);
        }

        const data = new Uint8Array(message);
        const buf = new flatbuffers.ByteBuffer(data);

        if (ServerAssets.Code.Remote.LoginMsg.bufferHasIdentifier(buf)) {
            return this._onLoginMsg(rinfo, ServerAssets.Code.Remote.LoginMsg.getRootAsLoginMsg(buf));
        }

        console.log("First message must be loginmsg");
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
     * @param {Assets.Code.Remote.LoginMsg} loginMsg
     */
    _onLoginMsg(rinfo, loginMsg) {
        return this.playerManager
            .connect(loginMsg.token())
            .then(player => {
                const connectionHandler = new ConnectionHandler(rinfo, player, this.playerManager, this);
                player.udpConnectionHandler = connectionHandler;

                this.connectionHandlers.set(ConnectionManager.makeKey(rinfo), connectionHandler);

                console.log(`Player #${player.id} connected`);
            })
            .catch(error => console.log(error));
    }

    static makeKey(rinfo) {
        return `${rinfo.address}:${rinfo.port}`;
    }
};