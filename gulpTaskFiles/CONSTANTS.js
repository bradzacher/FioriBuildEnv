'use strict';

const extend = require('extend');
const util = require('gulp-util');

// directory definitions
const SRC = 'src';
const PATHS = {
    src: {
        js: [`${SRC}/js/**/*.js`],
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

/**
 * Fresh reads the sap-config.json file
 */
const readConfig = () => {
    const configFile = './sap-config.json';

    // delete from cache
    // modified from https://stackoverflow.com/a/14801711/3736051
    // Resolve the module identified by the specified name
    let mod = require.resolve(configFile);

    // Check if the module has been resolved and found within the cache
    // eslint-disable-next-line no-cond-assign
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function traverse(module) {
            // Go over each of the module's children and
            // traverse them
            module.children.forEach((child) => {
                traverse(child);
            });

            // Call the specified callback providing the
            // found cached module
            delete require.cache[mod.id];
        }(mod));
    }

    // eslint-disable-next-line global-require
    const sapConfig = require(configFile);
    return extend({
        gateway: null, // the url of the gateway server
        localDevPort: '3000', // the port which the local server will run from
        bspDeployTarget: null, // the name of the bsp application
    }, sapConfig);
};

module.exports = {
    PATHS,
    SIZE_OPTS,
    beep,
    readConfig,
};
