const ConnectionHandlerTcp = require('./connection-handler-tcp');
const net = require('net');
const debug = require('debug')('sectord17-game:game-tcp');
const report = require('../../errors/reporter');

module.exports = function (ip, port, playerManager) {
    let serverTcp = net.createServer();

    serverTcp.on('connection', socket => new ConnectionHandlerTcp(socket, playerManager).start());

    serverTcp.on('error', error => report(error));

    serverTcp.on('listening', () => {
        const address = serverTcp.address();
        debug(`Listening on ${address.address}:${address.port}`);
    });

    serverTcp.listen(port, ip);

    return serverTcp;
};