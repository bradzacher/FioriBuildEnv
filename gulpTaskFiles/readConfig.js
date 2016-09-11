'use strict';

const extend = require('extend');

// sap config
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
        jsNamespace: null, // the namespace for the javascript components
    }, sapConfig);
};

module.exports = readConfig;
