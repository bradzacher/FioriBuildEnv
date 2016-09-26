'use strict';

const gulp        = require('gulp');
const concat      = require('gulp-concat');
const rename      = require('gulp-rename');
const size        = require('gulp-size');
const sourcemaps  = require('gulp-sourcemaps');
const uglify      = require('gulp-uglify');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

function buildJsLib() {
    const promise = new Promise((resolve, reject) => {
        const res = gulp.src(PATHS.src.jsLib)
                .pipe(size(SIZE_OPTS))
                // write the non-minified file + map
                .pipe(sourcemaps.init())
                .pipe(concat(PATHS.build.jsLib))
                .pipe(rename({
                    suffix: '-dbg',
                }))
                .pipe(sourcemaps.write())
                .pipe(gulp.dest(PATHS.build.root))
                .on('error', () => reject());
        res.on('end', () => {
            // write the minfiied file + map
            gulp.src(`${PATHS.build.root}/lib-dbg.js`)
                .pipe(rename((p) => {
                    p.basename = p.basename.replace('-dbg', '');
                }))
                .pipe(sourcemaps.init())
                .pipe(uglify())
                .pipe(sourcemaps.write())
                .pipe(gulp.dest(PATHS.build.root))
                .on('error', () => reject())
                .on('end', () => resolve());
        });
    });
    return promise;
}
gulp.task('build-js-lib', buildJsLib);

module.exports = buildJsLib;
