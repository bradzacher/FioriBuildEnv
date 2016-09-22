'use strict';

const gulp        = require('gulp');
const concat      = require('gulp-concat');
const size        = require('gulp-size');
const uglify      = require('gulp-uglify');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

function buildJsLib() {
    return gulp.src(PATHS.src.jsLib)
               .pipe(size(SIZE_OPTS))
               .pipe(concat(PATHS.build.jsLib))
               .pipe(uglify())
               .pipe(gulp.dest(PATHS.build.root));
}
gulp.task('build-js-lib', buildJsLib);

module.exports = buildJsLib;
