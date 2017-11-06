const Buffer = require('buffer').Buffer;

module.exports.splitData = (message, callback) => {
    const data = new Uint8Array(message);

    let startIndex = 0;
    while (startIndex < data.byteLength) {
        let length = 0;
        for (let i = 0; i < 4; ++i) {
            length += data[startIndex + i] * Math.pow(256, i);
        }

        let sliced = data.slice(startIndex + 4, startIndex + 4 + length);
        callback(sliced);

        startIndex += 4 + length;
    }
};

/**
 * @param {Uint8Array} message
 * @returns {Buffer2}
 */
module.exports.prependLength = message => {
    const length = message.length;

    const lengthArray = new Uint8Array([
        (length & 0x000000ff),
        (length & 0x0000ff00) >> 8,
        (length & 0x00ff0000) >> 16,
        (length & 0xff000000) >> 24
    ]);

    let output = new Uint8Array(lengthArray.byteLength + message.byteLength);
    output.set(lengthArray, 0);
    output.set(message, 4);

    return Buffer.from(output);
};