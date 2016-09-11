'use strict';

const gulp = require('gulp');
const size  = require('gulp-size');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

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

module.exports = buildI18n;
