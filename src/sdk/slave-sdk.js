class SlaveSDK {
    playersCountChanged(count) {
        this._send('players-count-changed', {
            playersCount: count
        });
    }

    booted() {
        this._send('booted');
    }

    _send(event, data) {
        if (process.send === undefined) {
            return;
        }

        process.send({event, data});
    }
}

module.exports = exports = SlaveSDK;
