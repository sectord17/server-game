const assert = require('assert');
const app = require('../app');

describe('Connection flow', function () {
    it('join the server', function () {
        app.playerManager.join();

        assert.equal(app.playerManager.allPending().length, 1);
    });

    it('enter the server', function () {
        app.playerManager.join()
            .then(player => app.playerManager.enter(player.token, '127.0.0.1', 8000, null));

        assert.equal(app.playerManager.allPending().length, 0);
        assert.equal(app.playerManager.all().length, 1);
    });
});