/* globals process */
'use strict';
/*************************
 * REQUIRES
 ************************/
const browserSync = require('browser-sync');
const del         = require('del');
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


/*************************
 * CONFIG
 ************************/
// sap config
const sapConfig = require('./gulpTaskFiles/readConfig.js')();

// directory definitions
const PATHS = require('./gulpTaskFiles/PATHS.js');

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
 * Compiles the JS, then browserifies it into a single file
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
    let css = PATHS.build.css;
    if (PATHS.build.css.indexOf('.min.') === -1) {
        css = css.replace('.css', '.min.css');
    }

    return gulp.src(PATHS.src.html)
        // print the files
        .pipe(size(SIZE_OPTS))
        // insert the references to the built files
        .pipe(htmlreplace({
            js: `js/${PATHS.build.js}`,
            css: `css/${css}`,
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
        // concat the files together and rename too!
        .pipe(concat(PATHS.build.css))
        // minify it as well
        .pipe(cssmin())
        // write the sourcemaps
        .pipe(sourcemaps.write('.'))
        // rename to show minification
        .pipe(rename({ extname: '.min.css' }))
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
    let server = null;

    if (isServer) {
        // eslint-disable-next-line global-require
        const serverStartedPromise = require('./gulpTaskFiles/server.js');
        serverStartedPromise.then(() => {
            // fetch the server instance
            server = browserSync.get('UI5-Server');
        });
    }

    function notify(msg) {
        isServer && server && server.notify(msg);
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
                isServer && server && res.on('end', server.reload);
            });
        });
    }

    // watch css and pipe into browser-sync when done
    gulp.watch(PATHS.src.css, () => {
        notify('Recompiling CSS');
        const res = buildCss();
        isServer && server && res.pipe(server.stream({ match: '**/*.css' }));
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

