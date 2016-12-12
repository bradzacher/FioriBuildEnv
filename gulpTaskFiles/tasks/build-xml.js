'use strict';

const gulp    = require('gulp');
const htmlmin = require('gulp-htmlmin');
const size    = require('gulp-size');

const packageList = require('../packageList');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

/**
 * Builds the XML
 */
function buildXml(type) {
    const promises = packageList.get().map(pckg => new Promise((resolve, reject) => {
        gulp.src(`${pckg.src}/${PATHS.src[`${type}Xml`]}`)
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
            .pipe(gulp.dest(`${pckg.dest}/${type}`))
            .on('error', reject)
            .on('end', resolve);
    }));
    return Promise.all(promises);
}
gulp.task('build-view-xml', () => buildXml('view'));
gulp.task('build-fragment-xml', () => buildXml('fragment'));
gulp.task('build-xml', ['build-view-xml', 'build-fragment-xml']);

module.exports = buildXml;
