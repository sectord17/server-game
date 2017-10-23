module.exports = exports = class SlaveSDK {
    playersCountChanged(count) {
        this._send('players-count-changed', {
            playersCount: count
        });
    }

    _send(event, data) {
        if (typeof process.send === 'undefined') {
            return;
        }

        process.send({event, data});
    }
};
