'use strict';

const gulp  = require('gulp');
const size  = require('gulp-size');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

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

module.exports = buildFonts;
