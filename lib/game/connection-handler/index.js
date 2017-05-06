module.exports = class ConnectionHandler {
    constructor(socket, playerManager) {
        this.socket = socket;
        this.playerManager = playerManager;
        this.player = null;
    }

    start() {
        this.socket.on('data', (data) => {
            if (data === "auth") {
                return this.onAuth("token");
            }
        });

        this.socket.on('end', () => {
            if (this.isAuthorized()) {
                this.playerManager.disconnect(this.player);
            }
        });

        // Disconnect client if not authorized within n seconds since connection
        setTimeout(() => {
            if (!this.isAuthorized()) {
                this.socket.destroy("No auth message within 10 seconds");
            }
        }, 1000 * 10);
    }

    isAuthorized() {
        return !!this.player;
    }

    onAuth(token) {
        this.playerManager.connect(token)
            .then(connectedPlayer => {
                this.player = connectedPlayer;
                this.player.connectionHandler = this;

                this.socket.write("auth_ok_message")
            })
            .catch(error => this.socket.write(error));
    }
};