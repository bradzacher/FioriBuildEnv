'use strict';

const gulp       = require('gulp');
const concat     = require('gulp-concat');
const cssmin     = require('gulp-cssmin');
const rename     = require('gulp-rename');
const sass       = require('gulp-sass');
const scsslint   = require('gulp-scss-lint');
const size       = require('gulp-size');
const sourcemaps = require('gulp-sourcemaps');
const util       = require('gulp-util');

const { PATHS, SIZE_OPTS, beep } = require('../CONSTANTS.js');

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
        // rename to show minification
        .pipe(rename({ extname: '.min.css' }))
        // write the sourcemaps
        .pipe(sourcemaps.write('.'))
        // write the result
        .pipe(gulp.dest(`${PATHS.build.root}/css`));
}
gulp.task('build-css', buildCss);

module.exports = buildCss;
