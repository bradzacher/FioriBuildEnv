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
const sass        = require('gulp-sass');
const scsslint    = require('gulp-scss-lint');
const size        = require('gulp-size');
const sourcemaps  = require('gulp-sourcemaps');
// const uglify      = require('gulp-uglify');
const ui5preload  = require('gulp-ui5-preload');
const util        = require('gulp-util');
const proxy       = require('http-proxy-middleware');

const Promise     = require('promise');
const zipFolder   = Promise.denodeify(require('zip-folder'));
const mkdirp      = Promise.denodeify(require('mkdirp'));
const readFile    = Promise.denodeify(fs.readFile);

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
        prd: {
            jsLib: 'common.min.js',
            cssLib: 'common.min.css',
            root: 'release',
            js: 'app.min.js',
            css: 'styles.min.css',
        },
        dev: {
            jsLib: 'common.js',
            cssLib: 'common.css',
            root: 'build',
            js: 'app.js',
            css: 'styles.css',
        },
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
        PATHS.build.dev.root,
        PATHS.build.prd.root,
        PATHS.zip,
    ]);
    cb(null);
});

/**
 * copies the fonts into the dir
 */
function buildFonts(env) {
    return gulp.src(PATHS.src.fonts)
        // print out the file deets
        .pipe(size(SIZE_OPTS))
        // write the result
        .pipe(gulp.dest(`${PATHS.build[env].root}/font`));
}
gulp.task('build-dev-font', () => buildFonts('dev'));
gulp.task('build-prd-font', () => buildFonts('prd'));

/**
 * copies the i18n into the dir
 */
function buildI18n(env) {
    return gulp.src(PATHS.src.i18n)
        // print out the file deets
        .pipe(size(SIZE_OPTS))
        // write the result
        .pipe(gulp.dest(`${PATHS.build[env].root}/i18n`));
}
gulp.task('build-dev-i18n', () => buildI18n('dev'));
gulp.task('build-prd-i18n', () => buildI18n('prd'));

/**
 * copies json files into the dir
 */
function buildJson(env) {
    return gulp.src(PATHS.src.json)
        // print out the file deets
        .pipe(size(SIZE_OPTS))
        // write the result
        .pipe(gulp.dest(`${PATHS.build[env].root}`));
}
gulp.task('build-dev-json', () => buildJson('dev'));
gulp.task('build-prd-json', () => buildJson('prd'));

/**
 * Builds the XML and transforms the resource tags
 */
function buildXml(env, type) {
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
        .pipe(gulp.dest(`${PATHS.build[env].root}/${type}`));
}
gulp.task('build-dev-view-xml', () => buildXml('dev', 'view'));
gulp.task('build-prd-view-xml', () => buildXml('prd', 'view'));
gulp.task('build-dev-fragment-xml', () => buildXml('dev', 'fragment'));
gulp.task('build-prd-fragment-xml', () => buildXml('prd', 'fragment'));
gulp.task('build-dev-xml', ['build-dev-view-xml', 'build-dev-fragment-xml']);
gulp.task('build-prd-xml', ['build-prd-view-xml', 'build-prd-fragment-xml']);

/**
 * Compiles the TSX, then browserifies it into a single file
 */
function buildJs(env) {
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
                // put the lime in the coconut
                //.pipe(concat(PATHS.build[env].js))
                // uglify (if in prd)
                //.pipe(env === 'prd' ? uglify() : util.noop())
                // write the sourcemap
                .pipe(sourcemaps.write('.'))
                // write the js file
                .pipe(gulp.dest(`${PATHS.build[env].root}`));
}
gulp.task('build-dev-js', () => buildJs('dev'));
gulp.task('build-prd-js', () => buildJs('prd'));

/**
 * Builds the HTML and transforms the resource tags
 */
function buildHtml(env) {
    return gulp.src(PATHS.src.html)
        // print the files
        .pipe(size(SIZE_OPTS))
        // insert the references to the built files
        .pipe(htmlreplace({
            js: `js/${PATHS.build[env].js}`,
            jsLib: `lib/${PATHS.build[env].jsLib}`,
            cssLib: `lib/${PATHS.build[env].cssLib}`,
            css: `css/${PATHS.build[env].css}`,
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
        .pipe(gulp.dest(PATHS.build[env].root));
}
gulp.task('build-dev-html', () => buildHtml('dev'));
gulp.task('build-prd-html', () => buildHtml('prd'));

/**
 * Lints and compiles SASS, then concats and mins the css
 */
function buildCss(env) {
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
        .pipe(concat(PATHS.build[env].css))
        // if doing a prd build, minify it
        .pipe(env === 'prd' ? cssmin() : util.noop())
        // write the sourcemaps
        .pipe(sourcemaps.write('.'))
        // write the result
        .pipe(gulp.dest(`${PATHS.build[env].root}/css`));
}
gulp.task('build-dev-css', () => buildCss('dev'));
gulp.task('build-prd-css', () => buildCss('prd'));

/**
 * builds the Component-preload.js file
 */
function buildUi5Component(env) {
    const root = PATHS.build[env].root;
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
gulp.task('build-dev-ui5-component',
    ['build-dev-js', 'build-dev-html', 'build-dev-css', 'build-dev-font', 'build-dev-i18n', 'build-dev-json', 'build-dev-xml'],
    () => buildUi5Component('dev'));
gulp.task('build-prd-ui5-component',
    ['build-prd-js', 'build-prd-html', 'build-prd-css', 'build-prd-font', 'build-prd-i18n', 'build-prd-json', 'build-prd-xml'],
    () => buildUi5Component('prd'));

/**
 * Watches for changes
 */
function watch(isServer) {
    const env = 'dev';
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

                    // create directory
                    return mkdirp(`./${PATHS.zip}`)
                        .then(() => {
                            // zip the build folder
                            const zipFileName = `./${PATHS.zip}/${env}.zip`;
                            return zipFolder(PATHS.build[env].root, zipFileName)
                                .then((err) => {
                                    let html;

                                    if (err) {
                                        // somethign went wrong with zip process
                                        html = errorHtml.replace('{0}', JSON.stringify(err, null, 4));
                                        return null;
                                    }

                                    // read the zip file that was just created
                                    return readFile(zipFileName).then((zipRaw) => {
                                        // convert from raw bytes to base64
                                        const zipBase64 = btoa(String.fromCharCode.apply(null, zipRaw));
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
                                });
                        });
                },
            };

            browserSyncStarted = true;
            // config and start browsersync
            browserSync.init({
                server: {
                    baseDir: `./${PATHS.build[env].root}`,
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
            func(env).on('end', () => {
                // rebuild component-preload.js
                notify('Rebuilding Component-preload.js');
                const res = buildUi5Component(env);
                // reload the browser
                isServer && browserSyncStarted && res.on('end', browserSync.reload);
            });
        });
    }

    // watch css and pipe into browser-sync when done
    gulp.watch(PATHS.src.css, () => {
        notify('Recompiling CSS');
        const res = buildCss(env);
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

gulp.task('build-dev', ['build-dev-ui5-component']);
gulp.task('build-prd', ['build-prd-ui5-component']);

gulp.task('default', ['build-dev']);

