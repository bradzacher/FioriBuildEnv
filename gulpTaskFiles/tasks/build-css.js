'use strict';

const gulp       = require('gulp');
const cssmin     = require('gulp-cssmin');
const rename     = require('gulp-rename');
const sass       = require('gulp-sass');
const sasslint   = require('gulp-sass-lint');
const size       = require('gulp-size');
const sourcemaps = require('gulp-sourcemaps');

const packageList = require('../packageList');

const { PATHS, SIZE_OPTS, beep } = require('../CONSTANTS.js');

/**
 * Lints and compiles SASS, then concats and mins the css
 */
function buildCss(opts = { streamCallback() {} }) {
    const promises = packageList.get().map(pckg => new Promise((resolve, reject) => {
        const stream = gulp.src(`${pckg.src}/${PATHS.src.css}`)
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
            // minify it as well
            .pipe(cssmin())
            // rename to show minification
            .pipe(rename({ extname: '.min.css' }))
            // write the sourcemaps
            .pipe(sourcemaps.write('.'))
            // write the result
            .pipe(gulp.dest(`${pckg.dest}/css`))
            .on('error', reject)
            .on('end', resolve);
        opts.streamCallback && opts.streamCallback(stream);
    }));
    return Promise.all(promises);
}
gulp.task('build-css', buildCss);

module.exports = buildCss;
