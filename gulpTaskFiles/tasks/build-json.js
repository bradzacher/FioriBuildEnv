'use strict';

const gulp = require('gulp');
const size  = require('gulp-size');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

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

module.exports = buildJson;
