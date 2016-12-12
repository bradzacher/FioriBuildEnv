'use strict';

const gulp       = require('gulp');
const ui5preload = require('gulp-ui5-preload');

const packageList = require('../packageList');

/**
 * builds the Component-preload.js file
 */
function buildUi5Component() {
    const promises = packageList.get().map(pckg => new Promise((resolve, reject) => {
        const root = pckg.dest;
        return gulp.src([
            `!${root}/**/*-dbg.js`,
            `!${root}/**/Component-preload.js`,
            `${root}/**/*.js`,
            `${root}/**/*.xml`,
        ])
        .pipe(ui5preload({
            base: root,
            namespace: '',
            isLibrary: pckg.isLib,
        }))
        .pipe(gulp.dest(root))
            .on('error', reject)
            .on('end', resolve);
    }));
    return Promise.all(promises);
}
gulp.task('build-ui5-component',
    ['build-js', 'build-html', 'build-css', 'build-font', 'build-i18n', 'build-json', 'build-xml', 'build-js-lib'],
    buildUi5Component);

module.exports = buildUi5Component;
