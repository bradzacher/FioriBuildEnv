'use strict';

const util = require('gulp-util');

// directory definitions
const SRC = 'src';
const PATHS = {
    src: {
        js: [`${SRC}/js/**/*.js`], // [`${SRC}/js/**/*.ts`, `${SRC}/js/**/*.tsx`],
        css: [`${SRC}/css/**/*.scss`],
        fonts: [`${SRC}/fonts/*`],
        html: [`${SRC}/*.html`],
        viewXml: [`${SRC}/js/view/**/*.xml`],
        fragmentXml: [`${SRC}/js/fragment/**/*.xml`],
        i18n: [`${SRC}/js/i18n/**/*.properties`],
        json: [`${SRC}/js/**/*.json`],
    },
    build: {
        root: 'build',
        js: 'app.js',
        css: 'styles.css',
    },
    zip: 'zip',
};

// options for the size module
const SIZE_OPTS = {
    showFiles: true,
    gzip: true,
};

/**
 * Emits a beep
 */
const beep = function beep() { util.beep(); };

module.exports = {
    PATHS,
    SIZE_OPTS,
    beep,
};
