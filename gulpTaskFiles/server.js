'use strict';

const browserSync = require('browser-sync').create('UI5-Server');
const btoa        = require('btoa');
const electron    = require('electron-connect').server.create({ path: 'gulpTaskFiles/electron-auth.js', port: 30080, logLevel: 0 });
const extend      = require('extend');
const fs          = require('fs');
const proxy       = require('http-proxy-middleware');
const util        = require('gulp-util');

const Promise     = require('promise');
const zipFolder   = Promise.denodeify(require('zip-folder'));
const mkdirp      = Promise.denodeify(require('mkdirp'));
const readFile    = Promise.denodeify(fs.readFile);

/*************************
 * CONFIG
 ************************/
// directory definitions
const { PATHS, readConfig } = require('./CONSTANTS.js');

// sap config
const sapConfig = readConfig();

// unfortunately it is easy to cause a stackoverflow when using String.fromCharCode with a large enough array.
// this function is a workaround for that issue.
// taken from: https://stackoverflow.com/a/9458996/3736051
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

let successReceived = false;
/**
 * Authenticates to the server via electron
 */
function electronAuth(resolveAuth, rejectAuth) {
    electron.start();
    electron.on('auth-success', (authCookie) => {
        // for some reason sometimes the success fires twice
        // this will prevent us from trying to boot two servers on the port
        // todo - debug this
        if (successReceived) {
            return;
        }
        successReceived = true;

        electron.stop();

        resolveAuth(`${authCookie.name}=${authCookie.value}`);
    });

    electron.on('auth-failure', (err) => {
        rejectAuth(`Authentication Failure: ${err}`);
    });
}

/**
 * Fetches the auth tokens, and starts the browsersync server
 */
function server({ useAuth = true, useProxy = true, browserSyncOptions = { } }) {
    util.log(`Server will ${useAuth  ? '' : 'not '}authenticate with server.`);
    util.log(`Server will ${useProxy ? '' : 'not '}setup a proxy to server.`);

    if (!useProxy) {
        // no point using auth if we don't have the proxy!
        useAuth = false;
    }

    const serverStartedPromise = new Promise((resolve) => {
        let authTokenPromise = Promise.resolve('');
        if (useAuth) {
            // get auth data via an electron window, if requested
            authTokenPromise = new Promise(electronAuth);
        }
        authTokenPromise.catch((err) => {
            util.log(err);
            process.exit(1);
        });
        authTokenPromise.then((cookieHeader) => {
            let middleware = [];
            if (useProxy) {
                let confirmationHtml;
                let processingHtml;
                let errorHtml;
                readFile('./gulpTaskFiles/deploy/confirmation.html', 'utf8').then((text) => {
                    if (!text) {
                        throw new Error('file was empty');
                    }
                    confirmationHtml = text;
                })
                .catch((err) => {
                    util.log(`Error loding confirmation.html: ${err}`);
                });
                readFile('./gulpTaskFiles/deploy/processing.html', 'utf8').then((text) => {
                    if (!text) {
                        throw new Error('file was empty');
                    }
                    processingHtml = text;
                })
                .catch((err) => {
                    util.log(`Error loding processing.html: ${err}`);
                });
                readFile('./gulpTaskFiles/deploy/error.html', 'utf8').then((text) => {
                    if (!text) {
                        throw new Error('file was empty');
                    }
                    errorHtml = text;
                })
                .catch((err) => {
                    util.log(`Error loding error.html: ${err}`);
                });

                // called when the dev goes to http://localhost:<port>/deploy
                // displays a confirmation window for deployment
                const deploymentConfirmation = {
                    route: '/deploy',
                    handle: (req, res) => {
                        // re-read the config so it can be changed without restarting gulp
                        readConfig();

                        util.log('Request for /deploy received');

                        const html = confirmationHtml.replace('{0}', sapConfig.bspDeployTarget);
                        return res.end(html);
                    },
                };
                // called when the dev clicks the confirmation link
                // displays an info window for the deployment process
                const deploymentConfirmed = {
                    route: '/deploy/yes',
                    handle: (req, res) => {
                        // re-read the config so it can be changed without restarting gulp
                        readConfig();

                        util.log('Request for /deploy/yes received');

                        const zipPath = `./${PATHS.zip}`;
                        util.log(`Making directory "${zipPath}"...`);

                        // create directory
                        return mkdirp(zipPath)
                            .then(() => {
                                util.log('Successful.');

                                // zip the build folder
                                const zipFileName = `${zipPath}/deploy.zip`;
                                util.log(`Zipping build directory to "${zipFileName}"...`);
                                return zipFolder(PATHS.build.root, zipFileName)
                                    .then((err) => {
                                        let html;

                                        if (err) {
                                            const errStr = JSON.stringify(err, null, 4);
                                            util.log(`Error occurred: ${errStr}"`);
                                            // somethign went wrong with zip process
                                            html = errorHtml.replace('{0}', errStr);
                                            res.end(html);
                                        }
                                        util.log('Successful.');

                                        // read the zip file that was just created
                                        util.log('Reading zip file...');
                                        return readFile(zipFileName).then((zipRaw) => {
                                            util.log('Successful.');
                                            // convert from raw bytes to base64
                                            util.log('Converting to base64 string...');
                                            const zipBase64 = arrayBufferToBase64(zipRaw);
                                            util.log('Successful.');
                                            util.log('Returning HTML for processing.');
                                            const data = JSON.stringify({
                                                appName: sapConfig.bspDeployTarget,
                                                zipFile: zipBase64,
                                            });

                                            // the client will do the sending of the requests
                                            html = processingHtml.replace('{0}', JSON.stringify(sapConfig))
                                                .replace('{1}', cookieHeader)
                                                .replace('{2}', data);
                                            res.end(html);
                                        });
                                    })
                                    .catch((err) => {
                                        const errStr = JSON.stringify(err, null, 4);
                                        util.log(`Error occurred: ${errStr}"`);
                                        res.end(errorHtml.replace('{0}', errStr));
                                    });
                            });
                    },
                };

                // disable security rejections
                // this is easier than trying to make nodejs accept the ca
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
                // setup the middleware to proxy requests to GWD
                const sapProxy = proxy('/sap/', {
                    target: sapConfig.gateway,
                    changeOrigin: true,
                    headers: {
                        Cookie: cookieHeader,
                    },
                    secure: false,
                });
                const libProxy = proxy('**/resources/**', {
                    target: `${sapConfig.gateway}/sap/bc/ui5_ui5/ui2/ushell/shells/abap`,
                    changeOrigin: true,
                    headers: {
                        Cookie: cookieHeader,
                    },
                    secure: false,
                });

                middleware = [
                    sapProxy, libProxy,
                    // ordering of middleware matters here as routes are matched in that order
                    deploymentConfirmed, deploymentConfirmation,
                ];
            }

            // config and start browsersync
            const opts = extend({}, browserSyncOptions, {
                server: {
                    baseDir: `./${PATHS.build.root}`,
                    index: 'index.html',
                    middleware,
                },
                online: false,
                port: sapConfig.localDevPort,
                snippetOptions: {
                    blacklist: ['/deploy', '/deploy/yes'],
                },
                // disable input syncing
                ghostMode: {
                    clicks: false,
                    forms: false,
                    scroll: false,
                },
            });
            browserSync.init(opts);

            // resolve the promise
            resolve();
        });
    });

    return serverStartedPromise;
}

module.exports = server;
