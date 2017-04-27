module.exports = function () {
    let express = require('express'),
        net = require('net'),
        debug = require('debug')('sectord17:game'),
        app = express();

    let server = net.createServer();
    let port = parseInt(process.env.GAME_PORT) || 8000;
    let ip = process.env.IP || '127.0.0.1';

    server.listen(port, ip);
    server.on('error', (error) => {
        if (error.syscall !== 'listen') {
            throw error;
        }

        let bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
    server.on('listening', () => {
        let addr = server.address();
        let bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;

        debug('Listening on ' + bind);
    });

    return app;
};