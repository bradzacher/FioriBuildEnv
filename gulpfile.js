/* globals process */
'use strict';
/*************************
 * REQUIRES
 ************************/
const browserSync = require('browser-sync').create();
const btoa        = require('btoa');
const del         = require('del');
const electron    = require('electron-connect').server.create({ path: 'gulpTaskFiles/electron-auth.js' });
const extend      = require('extend');
const fs          = require('fs');
const gulp        = require('gulp');
const babel       = require('gulp-babel');
const concat      = require('gulp-concat');
const cssmin      = require('gulp-cssmin');
const eslint      = require('gulp-eslint');
const htmlreplace = require('gulp-html-replace');
const htmlmin     = require('gulp-htmlmin');
const rename      = require('gulp-rename');
const sass        = require('gulp-sass');
const scsslint    = require('gulp-scss-lint');
const size        = require('gulp-size');
const sourcemaps  = require('gulp-sourcemaps');
const ui5preload  = require('gulp-ui5-preload');
const util        = require('gulp-util');
const proxy       = require('http-proxy-middleware');

const Promise     = require('promise');
const zipFolder   = Promise.denodeify(require('zip-folder'));
const mkdirp      = Promise.denodeify(require('mkdirp'));
const readFile    = Promise.denodeify(fs.readFile);

// unfortunately it is easy to cause a stackoverflow when using String.fromCharCode with a large enough array.
// this function is a workaround for that issue.
// taken from: https://stackoverflow.com/a/9458996/3736051
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// sap config
let sapConfig;
const readConfig = () => {
    const configFile = './gulpTaskFiles/sap-config.json';

    // delete from cache
    // modified from https://stackoverflow.com/a/14801711/3736051
    // Resolve the module identified by the specified name
    let mod = require.resolve(configFile);

    // Check if the module has been resolved and found within the cache
    // eslint-disable-next-line no-cond-assign
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function traverse(module) {
            // Go over each of the module's children and
            // traverse them
            module.children.forEach((child) => {
                traverse(child);
            });

            // Call the specified callback providing the
            // found cached module
            delete require.cache[mod.id];
        }(mod));
    }

    // eslint-disable-next-line global-require
    sapConfig = require(configFile);
    sapConfig = extend({
        gateway: null, // the url of the gateway server
        localDevPort: '3000', // the port which the local server will run from
        bspDeployTarget: null, // the name of the bsp application
        jsNamespace: null, // the namespace for the javascript components
    }, sapConfig);
};
readConfig();

/*************************
 * CONFIG
 ************************/
// directory definitions
const SRC = 'src';
const PATHS = {
    src: {
        js: [`${SRC}/js/**/*.js`], // [`${SRC}/js/**/*.ts`, `${SRC}/js/**/*.tsx`],
        css: [`${SRC}/css/**/*.scss`],
        fonts: [`${SRC}/fonts/*`],
        html: [`${SRC}/*.html`],
        viewXml: [`${SRC}/js/view/**/*.xml`],
        fragmentXml: [`${SRC}/js/fragment/**/*.xml`],
        i18n: [`${SRC}/js/i18n/**/*.properties`],
        json: [`${SRC}/js/**/*.json`],
    },
    build: {
        jsLib: 'common.js',
        cssLib: 'common.css',
        root: 'build',
        js: 'app.js',
        css: 'styles.css',
    },
    zip: 'zip',
};

/**
 * Emits a beep
 */
const beep = function beep() { util.beep(); };

// options for the size module
const SIZE_OPTS = {
    showFiles: true,
    gzip: true,
};


/*************************
 * TASKS
 ************************/

/**
 * Cleans the build directories
 */
gulp.task('clean', (cb) => {
    del([
        PATHS.build.root,
        PATHS.zip,
    ]);
    cb(null);
});

/**
 * copies the fonts into the dir
 */
function buildFonts() {
    return gulp.src(PATHS.src.fonts)
        // print out the file deets
        .pipe(size(SIZE_OPTS))
        // write the result
        .pipe(gulp.dest(`${PATHS.build.root}/font`));
}
gulp.task('build-font', buildFonts);

/**
 * copies the i18n into the dir
 */
function buildI18n() {
    return gulp.src(PATHS.src.i18n)
        // print out the file deets
        .pipe(size(SIZE_OPTS))
        // write the result
        .pipe(gulp.dest(`${PATHS.build.root}/i18n`));
}
gulp.task('build-i18n', buildI18n);

/**
 * copies json files into the dir
 */
function buildJson() {
    return gulp.src(PATHS.src.json)
        // print out the file deets
        .pipe(size(SIZE_OPTS))
        // write the result
        .pipe(gulp.dest(`${PATHS.build.root}`));
}
gulp.task('build-json', buildJson);

/**
 * Builds the XML and transforms the resource tags
 */
function buildXml(type) {
    return gulp.src(PATHS.src[`${type}Xml`])
        // print the files
        .pipe(size(SIZE_OPTS))
        // minify the HTML
        .pipe(htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            useShortDoctype: true,
            keepClosingSlash: true,
            caseSensitive: true,
        }))
        // write the file
        .pipe(gulp.dest(`${PATHS.build.root}/${type}`));
}
gulp.task('build-view-xml', () => buildXml('view'));
gulp.task('build-fragment-xml', () => buildXml('fragment'));
gulp.task('build-xml', ['build-view-xml', 'build-fragment-xml']);

/**
 * Compiles the TSX, then browserifies it into a single file
 */
function buildJs() {
    return gulp.src(PATHS.src.js[0])
                // print the files
                .pipe(size(SIZE_OPTS))
                // lint the js
                .pipe(eslint())
                // print error an message and die on failure
                .pipe(eslint.format())
                .pipe(eslint.failAfterError())
                .on('error', beep)
                // prepare the source map
                .pipe(sourcemaps.init())
                // transpile to old JS
                .pipe(babel())
                // write the sourcemap
                .pipe(sourcemaps.write('.'))
                // write the js file
                .pipe(gulp.dest(`${PATHS.build.root}`));
}
gulp.task('build-js', buildJs);

/**
 * Builds the HTML and transforms the resource tags
 */
function buildHtml() {
    return gulp.src(PATHS.src.html)
        // print the files
        .pipe(size(SIZE_OPTS))
        // insert the references to the built files
        .pipe(htmlreplace({
            js: `js/${PATHS.build.js}`,
            jsLib: `lib/${PATHS.build.jsLib}`,
            cssLib: `lib/${PATHS.build.cssLib}`,
            css: `css/${PATHS.build.css}`,
        }))
        // minify the HTML
        .pipe(htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            useShortDoctype: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
        }))
        // write the file
        .pipe(gulp.dest(PATHS.build.root));
}
gulp.task('build-html', buildHtml);

/**
 * Lints and compiles SASS, then concats and mins the css
 */
function buildCss() {
    let hasBeeped = false;
    function myCustomReporter(file) {
        // this looks exactly like the default error printer
        if (!file.scsslint.success) {
            util.log(`${util.colors.green(file.scsslint.issues.length)} issues found in ${util.colors.red(file.path)}`);
            file.scsslint.issues.forEach((i) => {
                util.log(`${util.colors.green(file.relative)}: ${util.colors.red(i.line)} ${
                    util.colors.yellow(` [${i.severity.substring(0, 1).toUpperCase()}] `)} ${util.colors.green(i.linter)}: ${i.reason}`);
            });

            if (!hasBeeped) {
                // only beep once per build
                beep();
                hasBeeped = true;
            }
        }
    }
    return gulp.src(PATHS.src.css)
        // lint the css
        // we use a custom reporter because for some reason the default reporter kills gulp.watch
        .pipe(scsslint({ config: '.scss-lint.yml', customReport: myCustomReporter }))
        // prepare sourcemaps
        .pipe(sourcemaps.init())
        // compile the SASS
        .pipe(sass()
            // log on error
            .on('error', sass.logError))
        .on('error', beep)
        // print out the file deets
        .pipe(size(SIZE_OPTS))
        // concat the files together
        .pipe(concat(PATHS.build.css))
        // write the sourcemaps
        .pipe(sourcemaps.write('.'))
        // write the result
        .pipe(gulp.dest(`${PATHS.build.root}/css`))
        // minify it as well
        .pipe(cssmin())
        .pipe(rename({ extname: '.min.js' }))
        // write the result
        .pipe(gulp.dest(`${PATHS.build.root}/css`));
}
gulp.task('build-css', buildCss);

/**
 * builds the Component-preload.js file
 */
function buildUi5Component() {
    const root = PATHS.build.root;
    return gulp.src([
        `${root}/**/*.js`,
        `${root}/**/*.xml`,
        `!${root}/**/Component-preload.js`,
    ])
    .pipe(ui5preload({
        base: root,
        namespace: sapConfig.jsNamespace,
    }))
    .pipe(gulp.dest(root));
}
gulp.task('build-ui5-component',
    ['build-js', 'build-html', 'build-css', 'build-font', 'build-i18n', 'build-json', 'build-xml'],
    buildUi5Component);

/**
 * Watches for changes
 */
function watch(isServer) {
    let browserSyncStarted = false;

    if (isServer) {
        let successReceived = false;

        // get auth data via an electron window
        electron.start();
        electron.on('auth-success', (authCookie) => {
            // for some reason sometimes the success fires twice
            // this will prevent us from trying to boot two servers on the port
            if (successReceived) {
                return;
            }
            successReceived = true;

            electron.stop();

            const cookieHeader = `${authCookie.name}=${authCookie.value}`;

            // disable security rejections
            // this is easier than trying to make nodejs accept the sapn ca
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

            let confirmationHtml;
            let processingHtml;
            let errorHtml;
            readFile('./gulpTaskFiles/confirmation.html', 'utf8').then((text) => {
                confirmationHtml = text;
            });
            readFile('./gulpTaskFiles/processing.html', 'utf8').then((text) => {
                processingHtml = text;
            });
            readFile('./gulpTaskFiles/error.html', 'utf8').then((text) => {
                errorHtml = text;
            });

            // setup the middleware to proxy requests to GWD
            const sapProxy = proxy('/sap/', {
                target: sapConfig.gateway,
                changeOrigin: true,
                headers: {
                    Cookie: cookieHeader,
                },
                secure: false,
            });
            const libProxy = proxy('**/resources/**', {
                target: `${sapConfig.gateway}/sap/bc/ui5_ui5/ui2/ushell/shells/abap`,
                changeOrigin: true,
                headers: {
                    Cookie: cookieHeader,
                },
                secure: false,
            });
            // called when the dev goes to http://localhost:<port>/deploy
            // displays a confirmation window for deployment
            const deploymentConfirmation = {
                route: '/deploy',
                handle: (req, res) => {
                    // re-read the config so it can be changed without restarting gulp
                    readConfig();

                    util.log('Request for /deploy received');

                    const html = confirmationHtml.replace('{0}', sapConfig.bspDeployTarget);
                    return res.end(html);
                },
            };
            // called when the dev clicks the confirmation link
            // displays an info window for the deployment process
            const deploymentConfirmed = {
                route: '/deploy/yes',
                handle: (req, res) => {
                    // re-read the config so it can be changed without restarting gulp
                    readConfig();

                    util.log('Request for /deploy/yes received');

                    const zipPath = `./${PATHS.zip}`;
                    util.log(`Making directory "${zipPath}"...`);

                    // create directory
                    return mkdirp(zipPath)
                        .then(() => {
                            util.log('Successful.');

                            // zip the build folder
                            const zipFileName = `${zipPath}/div.zip`;
                            util.log(`Zipping build directory to "${zipFileName}"...`);
                            return zipFolder(PATHS.build.root, zipFileName)
                                .then((err) => {
                                    let html;

                                    if (err) {
                                        const errStr = JSON.stringify(err, null, 4);
                                        util.log(`Error occurred: ${errStr}"`);
                                        // somethign went wrong with zip process
                                        html = errorHtml.replace('{0}', errStr);
                                        res.end(html);
                                    }
                                    util.log('Successful.');

                                    // read the zip file that was just created
                                    util.log('Reading zip file...');
                                    return readFile(zipFileName).then((zipRaw) => {
                                        util.log('Successful.');
                                        // convert from raw bytes to base64
                                        util.log('Converting to base64 string...');
                                        const zipBase64 = arrayBufferToBase64(zipRaw);
                                        util.log('Successful.');
                                        util.log('Returning HTML for processing.');
                                        const data = JSON.stringify({
                                            appName: sapConfig.bspDeployTarget,
                                            zipFile: zipBase64,
                                        });

                                        // the client will do the sending of the requests
                                        html = processingHtml.replace('{0}', JSON.stringify(sapConfig))
                                                             .replace('{1}', cookieHeader)
                                                             .replace('{2}', data);
                                        res.end(html);
                                    });
                                })
                                .catch((err) => {
                                    const errStr = JSON.stringify(err, null, 4);
                                    util.log(`Error occurred: ${errStr}"`);
                                    res.end(errorHtml.replace('{0}', errStr));
                                });
                        });
                },
            };

            browserSyncStarted = true;
            // config and start browsersync
            browserSync.init({
                server: {
                    baseDir: `./${PATHS.build.root}`,
                    index: 'index.html',
                    middleware: [sapProxy, libProxy,
                        // order matters here as routes are matched in order
                        deploymentConfirmed, deploymentConfirmation],
                },
                online: false,
                port: sapConfig.localDevPort,
                snippetOptions: {
                    blacklist: ['/deploy', '/deploy/yes'],
                },
            });
        });
        electron.on('auth-failure', () => {
            process.exit(1);
            throw new Error('Authentication Failure');
        });
    }

    function notify(msg) {
        isServer && browserSyncStarted && browserSync.notify(msg);
        util.log(msg);
    }
    function watchUi5(key, func) {
        // watch for changes
        gulp.watch(PATHS.src[key], () => {
            // rebuild
            notify(`Recompiling ${key}`);
            func().on('end', () => {
                // rebuild component-preload.js
                notify('Rebuilding Component-preload.js');
                const res = buildUi5Component();
                // reload the browser
                isServer && browserSyncStarted && res.on('end', browserSync.reload);
            });
        });
    }

    // watch css and pipe into browser-sync when done
    gulp.watch(PATHS.src.css, () => {
        notify('Recompiling CSS');
        const res = buildCss();
        isServer && browserSyncStarted && res.pipe(browserSync.stream({ match: '**/*.css' }));
    });

    watchUi5('html', buildHtml);
    watchUi5('viewXml', e => buildXml(e, 'view'));
    watchUi5('fragmentXml', e => buildXml(e, 'fragment'));
    watchUi5('json', buildJson);
    watchUi5('i18n', buildI18n);
    watchUi5('fonts', buildFonts);
    watchUi5('js', buildJs);
}
gulp.task('watch', () => watch(true));
gulp.task('watch-no-server', () => watch(false));

gulp.task('build', ['build-ui5-component']);

gulp.task('default', ['build']);

