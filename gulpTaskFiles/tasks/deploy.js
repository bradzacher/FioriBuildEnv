'use strict';

const gulp     = require('gulp');
const electron = require('electron-connect').server.create({ path: 'gulpTaskFiles/electron-deploy.js', port: 30081 });
const util     = require('gulp-util');

function deploy() {
    // eslint-disable-next-line global-require
    const serverStartedPromise = require('../server.js')({
        browserSyncOptions: { open: false },
        useAuth: util.env.auth,
        useProxy: util.env.proxy,
    });
    serverStartedPromise.then(() => {
        // when the server starts, open the deployment URL in an electron window
        electron.start();
        // when the electron app quits, kill us too
        electron.on('quit', () => {
            process.exit(0);
        });
    });
}
gulp.task('deploy', deploy);
