// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const electron = require('electron');
const electronConnect = require('electron-connect').client;

const { readConfig } = require('./CONSTANTS.js');
const sapConfig = readConfig();

// Module to control application life.
const { app } = electron;
// Module to create native browser window.
const { BrowserWindow } = electron;

let client = null;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 800,
        center: true,
        toolbar: false,
        autoHideMenuBar: true,
    });

    // and gwd to get an auth cookie.
    win.loadURL(`http://localhost:${sapConfig.localDevPort}/deploy`);
    win.on('close', (e) => {
        // send the quit message
        client.sendMessage('quit');
        // stop the close or else our message won't get through
        e.preventDefault();
        // quit the app cos we're all done
        setTimeout(app.quit, 500);
    });

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });

    client = electronConnect.create(win, { port: 30081, logLevel: 0 });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    client.sendMessage('quit');
    setTimeout(app.quit, 500);
});
