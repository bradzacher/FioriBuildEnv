'use strict';

const gulp        = require('gulp');
const htmlreplace = require('gulp-html-replace');
const htmlmin     = require('gulp-htmlmin');
const size        = require('gulp-size');

const packageList = require('../packageList');

const { PATHS, SIZE_OPTS } = require('../CONSTANTS.js');

/**
 * Builds the HTML and transforms the resource tags
 */
function buildHtml() {
    const promises = packageList.get().map(pckg => new Promise((resolve, reject) => {
        let css = `${pckg.src}/${PATHS.build.css}`;
        if (PATHS.build.css.indexOf('.min.') === -1) {
            css = css.replace('.css', '.min.css');
        }

        gulp.src(`${pckg.src}/${PATHS.src.html}`)
            // print the files
            .pipe(size(SIZE_OPTS))
            // insert the references to the built files
            .pipe(htmlreplace({
                css: `${pckg.src}/css/${css}`,
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
            .pipe(gulp.dest(pckg.dest))
            .on('error', reject)
            .on('end', resolve);
    }));
    return Promise.all(promises);
}
gulp.task('build-html', buildHtml);

module.exports = buildHtml;
