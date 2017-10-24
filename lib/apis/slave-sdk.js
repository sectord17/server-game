module.exports = exports = class SlaveSDK {
    playersCountChanged(count) {
        this._send('players-count-changed', {
            playersCount: count
        });
    }

    booted() {
        this._send('booted');
    }

    _send(event, data) {
        if (typeof process.send === 'undefined') {
            return;
        }

        process.send({event, data});
    }
};
