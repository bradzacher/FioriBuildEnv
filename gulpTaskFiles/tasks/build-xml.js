'use strict';

const gulp    = require('gulp');
const htmlmin = require('gulp-htmlmin');
const size    = require('gulp-size');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

/**
 * Builds the XML
 */
function buildXml(type) {
    return gulp.src(PATHS.src[`${type}Xml`])
        // print the files
        .pipe(size(SIZE_OPTS))
        // minify the HTML
        .pipe(htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            useShortDoctype: true,
            keepClosingSlash: true,
            caseSensitive: true,
        }))
        // write the file
        .pipe(gulp.dest(`${PATHS.build.root}/${type}`));
}
gulp.task('build-view-xml', () => buildXml('view'));
gulp.task('build-fragment-xml', () => buildXml('fragment'));
gulp.task('build-xml', ['build-view-xml', 'build-fragment-xml']);

module.exports = buildXml;
