'use strict';

const gulp       = require('gulp');
const concat     = require('gulp-concat');
const cssmin     = require('gulp-cssmin');
const rename     = require('gulp-rename');
const sass       = require('gulp-sass');
const sasslint   = require('gulp-sass-lint');
const size       = require('gulp-size');
const sourcemaps = require('gulp-sourcemaps');

const { PATHS, SIZE_OPTS, beep } = require('../CONSTANTS.js');

/**
 * Lints and compiles SASS, then concats and mins the css
 */
function buildCss() {
    return gulp.src(PATHS.src.css)
        // lint the css
        // we use a custom reporter because for some reason the default reporter kills gulp.watch
        .pipe(sasslint({ config: '.sass-lint.yml' }))
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
