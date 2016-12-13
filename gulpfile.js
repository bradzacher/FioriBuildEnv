/* globals process */

'use strict';

const browserSync = require('browser-sync');
const gulp        = require('gulp');
const util        = require('gulp-util');

const packageList = require('./gulpTaskFiles/packageList');

const { PATHS } = require('./gulpTaskFiles/CONSTANTS.js');

/* eslint-disable import/no-dynamic-require */

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

/* eslint-enable import/no-dynamic-require */

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

    // rebuilds everything if required
    function rebuild() {
        if (packageList.refresh()) {
            // new packages, so rebuild everything
            return Promise.all([
                buildCss(),
                buildFont(),
                buildHtml(),
                buildI18n(),
                buildJs(),
                buildJsLib(),
                buildJson(),
                buildXml(),
            // build everything first...
            // then build the component preload
            ]).then(() => buildUi5Component());
        }
        return false;
    }

    // logs to the console and notifies the browserSync client (if started)
    function notify(msg) {
        server && server.notify(msg);
        util.log(msg);
    }
    // sets a watch on a set of files
    function watchFiles(key, func) {
        util.log(`Watching for changes to "${key}" files`);

        // watch for changes
        gulp.watch(`${PATHS.src.root}/**/${PATHS.src[key]}`, () => {
            // do a full rebuild maybe?
            const fullRebuild = rebuild();
            if (fullRebuild) {
                notify('Packages Changed, Doing Full Rebuild');
                fullRebuild.then(() => server && server.reload());
                return;
            }

            // rebuild just the required files
            notify(`Recompiling ${key}`);
            func().then(() => {
                // rebuild component-preload.js
                notify('Rebuilding Component-preload.js');
                const res = buildUi5Component();
                // reload the browser
                res.then(() => server && server.reload());
            });
        });
    }

    // watch css and pipe into browser-sync when done
    util.log('Watching for changes to "css" files');
    gulp.watch(`${PATHS.src.root}/**/${PATHS.src.css}`, () => {
        notify('Recompiling CSS');

        buildCss({
            // all tasks return a promise, we need to access the internal gulp stream
            // so that we can stream the result to the client via browserSync
            streamCallback(stream) {
                server && stream.pipe(server.stream({ match: '**/*.css' }));
            },
        });
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
