'use strict';

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

module.exports = PATHS;
