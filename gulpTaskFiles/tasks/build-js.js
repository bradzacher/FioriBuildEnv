'use strict';

const babel  = require('gulp-babel');
const eslint = require('gulp-eslint');
const gulp   = require('gulp');
const size   = require('gulp-size');
const sourcemaps  = require('gulp-sourcemaps');

const { PATHS, SIZE_OPTS, beep } = require('../CONSTANTS.js');

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

module.exports = buildJs;
