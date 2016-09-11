'use strict';

const gulp        = require('gulp');
const htmlreplace = require('gulp-html-replace');
const htmlmin     = require('gulp-htmlmin');
const size        = require('gulp-size');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

/**
 * Builds the HTML and transforms the resource tags
 */
function buildHtml() {
    let css = PATHS.build.css;
    if (PATHS.build.css.indexOf('.min.') === -1) {
        css = css.replace('.css', '.min.css');
    }

    return gulp.src(PATHS.src.html)
        // print the files
        .pipe(size(SIZE_OPTS))
        // insert the references to the built files
        .pipe(htmlreplace({
            js: `js/${PATHS.build.js}`,
            css: `css/${css}`,
        }))
        // minify the HTML
        .pipe(htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            useShortDoctype: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
        }))
        // write the file
        .pipe(gulp.dest(PATHS.build.root));
}
gulp.task('build-html', buildHtml);

module.exports = buildHtml;
