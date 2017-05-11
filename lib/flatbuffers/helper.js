const flatbuffers = require('flatbuffers').flatbuffers;
ServerAssets = require('./ServerSchema_generated').Assets;
const Buffer = require('buffer').Buffer;

module.exports = {
    /**
     * @param {string} name
     * @param {string} token
     * @param {int} udpPort
     * @return {Buffer2}
     */
    loginMsg(name, token, udpPort) {
        const builder = new flatbuffers.Builder(1024);
        const bName = builder.createString(name);
        const bToken = builder.createString(token);
        // const bUdpPort = builder.createString(udpPort);

        ServerAssets.Code.Remote.LoginMsg.startLoginMsg(builder);
        ServerAssets.Code.Remote.LoginMsg.addName(builder, bName);
        ServerAssets.Code.Remote.LoginMsg.addToken(builder, bToken);
        // Assets.Code.Remote.LoginMsg.addUdpPort(builder, bUdpPort);

        const loginMsg = ServerAssets.Code.Remote.LoginMsg.endLoginMsg(builder);

        ServerAssets.Code.Remote.LoginMsg.finishLoginMsgBuffer(builder, loginMsg);

        return Buffer.from(builder.asUint8Array());
    }
};