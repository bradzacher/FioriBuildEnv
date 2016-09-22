'use strict';

const gulp        = require('gulp');
const electron    = require('electron-connect').server.create({ path: 'gulpTaskFiles/electron-deploy.js', port: 30081, logLevel: 0 });
const runSequence = require('run-sequence');
const util        = require('gulp-util');

function deployStartServer() {
    // eslint-disable-next-line global-require
    const serverStartedPromise = require('../server.js')({
        browserSyncOptions: { open: false },
        useAuth: util.env.auth !== false,
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
// TODO - when gulp v4 use gulp.series
// unfortunately gulp.series is not out till v4, and the run-sequence lib doesn't like input functions, so we have to define a task
gulp.task('deploy-start-server', deployStartServer);

function deploy() {
    if (util.env.rebuild !== false) {
        // asked for a rebuild, so do that before launching
        runSequence('build-ui5-component', 'deploy-start-server');
    } else {
        deployStartServer();
    }
}
gulp.task('deploy', deploy);
