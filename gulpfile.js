/* globals process */
'use strict';

const browserSync = require('browser-sync');
const gulp        = require('gulp');
const util        = require('gulp-util');

const { PATHS } = require('./gulpTaskFiles/CONSTANTS.js');

// require the tasks from their files
const tasksDir = './gulpTaskFiles/tasks/';
const buildCss          = require(`${tasksDir}/build-css.js`);
const buildFont         = require(`${tasksDir}/build-font.js`);
const buildHtml         = require(`${tasksDir}/build-html.js`);
const buildI18n         = require(`${tasksDir}/build-i18n.js`);
const buildJs           = require(`${tasksDir}/build-js.js`);
const buildJsLib        = require(`${tasksDir}/build-js-lib.js`);
const buildJson         = require(`${tasksDir}/build-json.js`);
const buildUi5Component = require(`${tasksDir}/build-ui5-component.js`);
const buildXml          = require(`${tasksDir}/build-xml.js`);
require(`${tasksDir}/clean.js`);
require(`${tasksDir}/deploy.js`);

/**
 * Watches for changes
 */
function watch() {
    let server = null;

    // start the server if requested
    if (util.env.server !== false) {
        // eslint-disable-next-line global-require
        const serverStartedPromise = require('./gulpTaskFiles/server.js')({
            useAuth: util.env.auth !== false,
            useProxy: util.env.proxy !== false,
        });
        serverStartedPromise.then(() => {
            // fetch the server instance
            server = browserSync.get('UI5-Server');
        });
    }

    // logs to the console and notifies the browserSync client (if started)
    function notify(msg) {
        server && server.notify(msg);
        util.log(msg);
    }
    // sets a watch on a set of files
    function watchFiles(key, func) {
        // watch for changes
        gulp.watch(PATHS.src[key], () => {
            // rebuild
            notify(`Recompiling ${key}`);
            function onEnd() {
                // rebuild component-preload.js
                notify('Rebuilding Component-preload.js');
                const res = buildUi5Component();
                // reload the browser
                server && res.on('end', server.reload);
            }

            const res = func();
            if (res.on) {
                res.on('end', onEnd);
            } else {
                res.then(onEnd);
            }
        });
    }

    // watch css and pipe into browser-sync when done
    gulp.watch(PATHS.src.css, () => {
        notify('Recompiling CSS');
        const res = buildCss();
        server && res.pipe(server.stream({ match: '**/*.css' }));
    });

    // setup all the watches
    watchFiles('html', buildHtml);
    watchFiles('viewXml', () => buildXml('view'));
    watchFiles('fragmentXml', () => buildXml('fragment'));
    watchFiles('json', buildJson);
    watchFiles('i18n', buildI18n);
    watchFiles('fonts', buildFont);
    watchFiles('js', buildJs);
    watchFiles('jsLib', buildJsLib);
}
gulp.task('watch', watch);

gulp.task('build', ['build-ui5-component']);

gulp.task('default', ['build']);
