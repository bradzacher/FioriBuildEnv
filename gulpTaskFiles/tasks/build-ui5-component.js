'use strict';

const gulp       = require('gulp');
const ui5preload = require('gulp-ui5-preload');

const { PATHS } = require('../CONSTANTS.js');

/**
 * builds the Component-preload.js file
 */
function buildUi5Component() {
    const root = PATHS.build.root;
    return gulp.src([
        `${root}/**/*.js`,
        `${root}/**/*.xml`,
        `!${root}/**/Component-preload.js`,
    ])
    .pipe(ui5preload({
        base: root,
    }))
    .pipe(gulp.dest(root));
}
gulp.task('build-ui5-component',
    ['build-js', 'build-html', 'build-css', 'build-font', 'build-i18n', 'build-json', 'build-xml'],
    buildUi5Component);

module.exports = buildUi5Component;
