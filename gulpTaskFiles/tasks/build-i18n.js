'use strict';

const gulp = require('gulp');
const size  = require('gulp-size');

const packageList = require('../packageList');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

/**
 * copies the i18n into the dir
 */
function buildI18n() {
    const promises = packageList.get().map(pckg => new Promise((resolve, reject) => {
        gulp.src(`${pckg.src}/${PATHS.src.i18n}`)
            // print out the file deets
            .pipe(size(SIZE_OPTS))
            // write the result
            .pipe(gulp.dest(`${pckg.dest}/i18n`))
            .on('error', reject)
            .on('end', resolve);
    }));
    return Promise.all(promises);
}
gulp.task('build-i18n', buildI18n);

module.exports = buildI18n;
