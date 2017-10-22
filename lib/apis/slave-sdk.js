module.exports = exports = class SlaveSDK {
    noPlayers() {
        this._send('no-players');
    }

    _send(event) {
        process.send({event});
    }
};
