module.exports = exports = class SlaveSDK {
    _send(event) {
        process.send({event});
    }
};
