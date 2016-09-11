'use strict';

const del  = require('del');
const gulp = require('gulp');

const { PATHS } = require('../CONSTANTS.js');

/**
 * Cleans the build directories
 */
gulp.task('clean', (cb) => {
    del([
        PATHS.build.root,
        PATHS.zip,
    ]);
    cb(null);
});
