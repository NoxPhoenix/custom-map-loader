// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const Promise = require('bluebird');
const fs = require('fs');
const yargs = require('yargs/yargs');

global.AppPath = app.getPath('userData');
global.AppData = app.getAppPath();
global.ExecPath = process.execPath;
const { argv, parse } = yargs(process.argv);
const configExists = fs.existsSync(`${AppPath}/config.json`);
if (!configExists) fs.writeFileSync(`${AppPath}/config.json`, JSON.stringify({}));

const initializeApp = require('./lib/startup');
require('./lib/openDirectory');
const state = require('./lib/stateManager');
const { importMap } = require('./lib/customMaps');
require('./lib/manageMapFiles');
const path = require('path');
const { ipcMain } = require('electron/main');

const config = require(`${AppPath}/config.json`);

async function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 790,
    height: 550,
    minWidth: 790,
    minHeight: 305,
    // resizable: false,
    autoHideMenuBar: true,
    show: false,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  const startupWindow = new BrowserWindow({
    width: 400,
    height: 200,
    resizable: false,
    // parent: mainWindow,
    fullscreenable: false,
    fullscreen: false,
    maximizable: false,
    // modal: true,
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  const findRocketLeagueModal = new BrowserWindow({
    width: 400,
    height: 200,
    resizable: false,
    parent: mainWindow,
    fullscreenable: false,
    fullscreen: false,
    maximizable: false,
    modal: true,
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  state.setState({ mainWindow });

  if (!config.customMapDirectory) {
    startupWindow.loadFile('./src/intro.html');
    // startupWindow.webContents.openDevTools({ mode: 'detach' });
    startupWindow.show();
    startupWindow.on('close', () => {
      if (!state.getFromState('customMapDirectory')) app.quit();
    });
  } else {
    startupWindow.close();
    mainWindow.loadFile('src/index.html');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
    mainWindow.show();
  }

  ipcMain.on('locateRocketLeague', () => {
    findRocketLeagueModal.loadFile('./src/rocketLeagueDirectoryModal.html');
    findRocketLeagueModal.show();
    // findRocketLeagueModal.webContents.openDevTools({ mode: 'detach' });
  });

  ipcMain.on('configLoaded', () => {
    mainWindow.loadFile('src/index.html');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
    mainWindow.show();

    if (!config || !config.rocketLeagueDirectory) {
      findRocketLeagueModal.loadFile('./src/rocketLeagueDirectoryModal.html');
      findRocketLeagueModal.show();
    }
  });
  // and load the index.html of the app.

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

const handleArgs = () => {
  if (!argv.map) return null;
  return importMap(argv.map, state.getFromState('customMapDirectory'));
};

const gotTheLock = app.requestSingleInstanceLock();

const handleSecond = () => {
  if (!gotTheLock) return app.quit().then(Promise.delay(500));
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    const mainWindow = state.getFromState('mainWindow');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    return importMap(parse(commandLine).allowFileAccessFromFiles, state.getFromState('customMapDirectory'));
  });
  return null;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
initializeApp()
  .then(handleSecond)
  .then(handleArgs)
  .then(app.whenReady)
  .then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
