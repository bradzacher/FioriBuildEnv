'use strict';

const gulp        = require('gulp');
const concat      = require('gulp-concat');
const rename      = require('gulp-rename');
const size        = require('gulp-size');
const sourcemaps  = require('gulp-sourcemaps');
const uglify      = require('gulp-uglify');

const packageList = require('../packageList');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

function buildJsLib() {
    const promises = packageList.get().map(pckg => new Promise((resolve, reject) => {
        const res = gulp.src(`${pckg.src}/${PATHS.src.jsLib}`)
                .pipe(size(SIZE_OPTS))
                // write the non-minified file + map
                .pipe(sourcemaps.init())
                .pipe(concat(PATHS.build.jsLib))
                .pipe(rename({
                    suffix: '-dbg',
                }))
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest(pckg.dest))
                .on('error', reject);
        res.on('end', () => {
            // write the minified file + map
            gulp.src(`${pckg.dest}/lib-dbg.js`)
                .pipe(rename((p) => {
                    p.basename = p.basename.replace('-dbg', '');
                }))
                .pipe(sourcemaps.init())
                .pipe(uglify())
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest(pckg.dest))
                .on('error', reject)
                .on('end', resolve);
        });
    }));
    return Promise.all(promises);
}
gulp.task('build-js-lib', buildJsLib);

module.exports = buildJsLib;
