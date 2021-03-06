'use strict';

const gulp  = require('gulp');
const size  = require('gulp-size');

const packageList = require('../packageList');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

/**
 * copies the fonts into the dir
 */
function buildFonts() {
    const promises = packageList.get().map(pckg => new Promise((resolve, reject) => {
        gulp.src(`${pckg.src}/${PATHS.src.fonts}`)
            // print out the file deets
            .pipe(size(SIZE_OPTS))
            // write the result
            .pipe(gulp.dest(`${pckg.dest}/font`))
            .on('error', reject)
            .on('end', resolve);
    }));
    return Promise.all(promises);
}
gulp.task('build-font', buildFonts);

module.exports = buildFonts;
