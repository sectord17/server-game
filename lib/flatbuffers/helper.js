const flatbuffers = require('flatbuffers').flatbuffers;
ServerAssets = require('./ServerSchema_generated').Assets;

module.exports = {
    /**
     * @param {string} name
     * @param {string} token
     * @param {int} udpPort
     * @return {Assets.Code.Remote.LoginMsg}
     */
    loginMsg(name, token, udpPort) {
        const builder = new flatbuffers.Builder(1024);
        const bName = builder.createString(name);
        const bToken = builder.createString(token);
        // const bUdpPort = builder.createString(udpPort);

        Assets.Code.Remote.LoginMsg.startLoginMsg(builder);
        Assets.Code.Remote.LoginMsg.addName(builder, bName);
        Assets.Code.Remote.LoginMsg.addToken(builder, bToken);
        // Assets.Code.Remote.LoginMsg.addUdpPort(builder, bUdpPort);

        const loginMsg = Assets.Code.Remote.LoginMsg.endLoginMsg(builder);

        return Assets.Code.Remote.LoginMsg.finishLoginMsgBuffer(builder, loginMsg);
    }
};