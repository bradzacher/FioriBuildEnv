'use strict';

const babel       = require('gulp-babel');
const eslint      = require('gulp-eslint');
const gulp        = require('gulp');
const size        = require('gulp-size');
const sourcemaps  = require('gulp-sourcemaps');
const rename      = require('gulp-rename');
const uglify      = require('gulp-uglify');

const packageList = require('../packageList');

const { PATHS, SIZE_OPTS, beep } = require('../CONSTANTS.js');

/**
 * Compiles the JS, then browserifies it into a single file
 */
function buildJs() {
    const promises = packageList.get().map(pckg => new Promise((resolve, reject) => {
        gulp.src(`${pckg.src}/${PATHS.src.js}`)
            // print the files
            .pipe(size(SIZE_OPTS))
            // lint the js
            .pipe(eslint())
            // print error an message and die on failure
            .pipe(eslint.format())
            .pipe(eslint.failAfterError())
            .on('error', beep)
            .on('error', reject)
            // ui5 wants this suffix on non-minified files
            .pipe(rename((p) => {
                const dotIndex = p.basename.indexOf('.');
                if (dotIndex === -1) {
                    p.basename = `${p.basename}-dbg`;
                } else {
                    p.basename = `${p.basename.substring(0, dotIndex)}-dbg${p.basename.substring(dotIndex)}`;
                }
            }))
            // prepare the source map
            .pipe(sourcemaps.init())
            // transpile to old JS
            .pipe(babel())
            // write the sourcemap
            .pipe(sourcemaps.write('.'))
            // write the js file
            .pipe(gulp.dest(pckg.dest)) // todo - fix this?
            .on('error', reject)

            // wait for the initial generation to finish before going for the minification
            // we have to do this because of the funny naming convention
            .on('end', () => {
                // minify
                gulp.src(`${pckg.dest}/**/*-dbg*.js`)
                    // remove the -dbg from the name
                    .pipe(rename((p) => {
                        p.basename = p.basename.replace('-dbg', '');
                    }))
                    // new sourcemap
                    .pipe(sourcemaps.init())
                    // minifiy
                    .pipe(uglify())
                    // write the sourcemap
                    .pipe(sourcemaps.write('.'))
                    // write the js file
                    .pipe(gulp.dest(pckg.dest)) // todo - fix this?
                    .on('error', reject)
                    .on('end', resolve);
            });
    }));

    return Promise.all(promises);
}
gulp.task('build-js', buildJs);

module.exports = buildJs;
