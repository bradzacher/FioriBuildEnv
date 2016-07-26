// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const electron = require('electron');
const electronConnect = require('electron-connect').client;

const sapConfig = require('./sap-config.json');

// Module to control application life.
const { app } = electron;
// Module to create native browser window.
const { BrowserWindow } = electron;


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// true if we've authed - false otherwise
let hasAuthed = false;
let client = null;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 400,
        height: 800,
        center: true,
        toolbar: false,
        autoHideMenuBar: true,
    });

    // and gwd to get an auth cookie.
    win.loadURL(`${sapConfig.gateway}/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html`, {
        // spoof UA to look like IE11 so that we can work around the missing whitelist chrome UA
        userAgent: 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko',
    });

    // listnen for redirect requests
    win.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
        // this redirect in particular means SAP has received the SAML token and created the cookies
        if (oldUrl.indexOf(`${sapConfig.gateway}/sap/saml2/sp/acs/100`) !== -1 &&
            newUrl.indexOf(`${sapConfig.gateway}/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html`) !== -1) {
            // listen for the next response so we can grab our session id
            win.webContents.on('did-get-response-details', () => {
                win.webContents.session.cookies.get({}, (error, cookies) => {
                    // forward the cookie onto the gulp script
                    const cookie = cookies.filter((c) => c.name === 'SAP_SESSIONID_GWD_100')[0];
                    client.sendMessage('auth-success', {
                        name: cookie.name,
                        value: cookie.value,
                    });
                    hasAuthed = true;
                    // quit the app cos we're all done
                    setTimeout(app.quit, 500);
                });
            });
        }
    });

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });

    client = electronConnect.create(win);
    client.sendMessage('test');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (!hasAuthed) {
        client.sendMessage('auth-failure');
    }
    setTimeout(app.quit, 500);
});
