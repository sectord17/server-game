const flatbuffers = require('flatbuffers').flatbuffers;
const ServerAssets = require('../../flatbuffers/ServerSchema_generated').Assets;
const ConnectionHandlerUdp = require('./connection-handler-udp');

module.exports = class ConnectionManagerUdp {
    constructor(server, playerManager) {
        this.server = server;
        this.playerManager = playerManager;
        this.connectionHandlers = new Map();
    }

    onMessage(message, rinfo) {
        const connectionHandlerUdp = this.connectionHandlers.get(ConnectionManagerUdp.makeKey(rinfo));
        if (connectionHandlerUdp) {
            return connectionHandlerUdp.onMessage(message);
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
            .filter(player => player.connectionHandlerUdp);

        if (filterPlayers) {
            players = players.filter(filterPlayers);
        }

        players.forEach(player => {
            const rinfo = player.connectionHandlerUdp.rinfo;

            this.server.send(message, 0, message.length, rinfo.port, rinfo.address);
        });
    }

    /**
     * @param {ConnectionHandlerUdp} connectionHandlerUdp
     */
    disconnect(connectionHandlerUdp) {
        this.connectionHandlers.delete(connectionHandlerUdp.key());
    }

    /**
     * @param rinfo
     * @param {Assets.Code.Remote.LoginMsg} loginMsg
     */
    _onLoginMsg(rinfo, loginMsg) {
        return this.playerManager
            .connect(loginMsg.token())
            .then(player => {
                const connectionHandlerUdp = new ConnectionHandlerUdp(rinfo, player, this.playerManager, this);

                player.setConnectedViaUdp(connectionHandlerUdp);
                this.connectionHandlers.set(connectionHandlerUdp.key(), connectionHandlerUdp);
            })
            .catch(error => console.log(error));
    }

    static makeKey(rinfo) {
        return `${rinfo.address}:${rinfo.port}`;
    }
};