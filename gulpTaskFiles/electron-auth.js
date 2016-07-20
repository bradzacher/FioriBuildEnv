const electron = require('electron');
const electronConnect = require('electron-connect').client;

// Module to control application life.
const {
    app
} = electron;
// Module to create native browser window.
const {
    BrowserWindow
} = electron;

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
        autoHideMenuBar: true
    });

    // and gwd to get an auth cookie.
    win.loadURL('https://sapgwdev001.etsa.com.au:2080/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html');

    // listnen for redirect requests
    win.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl) {
        // this redirect in particular means SAP has received the SAML token and created the cookies
        if (oldUrl.indexOf('https://sapgwdev001.etsa.com.au:2080/sap/saml2/sp/acs/100') != -1 &&
            newUrl.indexOf('https://sapgwdev001.etsa.com.au:2080/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html') != -1) {
            // listen for the next response so we can grab our session id 
            win.webContents.on('did-get-response-details', function() {
                win.webContents.session.cookies.get({}, (error, cookies) => {
                    // forward the cookie onto the gulp script
                    var cookie = cookies.filter((c) => c.name === 'SAP_SESSIONID_GWD_100')[0];
                    client.sendMessage('auth-success', {
                        name: cookie.name,
                        value: cookie.value
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