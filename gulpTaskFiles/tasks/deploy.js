'use strict';

const gulp        = require('gulp');
const open        = require('open');

const { readConfig } = require('../CONSTANTS.js');

function deploy() {
    const sapConfig = readConfig();

    // eslint-disable-next-line global-require
    const serverStartedPromise = require('../server.js')({ browserSyncOptions: { open: false } });
    serverStartedPromise.then(() => {
        // when the server starts, open the deployment URL
        open(`http://localhost:${sapConfig.localDevPort}/deploy`);
    });
}
gulp.task('deploy', deploy);
