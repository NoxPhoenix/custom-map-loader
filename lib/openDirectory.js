const { ipcMain, shell } = require('electron');

const stateManager = require('./stateManager');

ipcMain.on('openCustomMapFolder', () => {
  const path = stateManager.getFromState('customMapDirectory');
  return shell.openPath(path);
});

// ipcMain.on('openWebsite', () => {
//   console.log('Working????')
//   shell.openExternal('https://www.lethamyr.com', { activate: true });
// });
