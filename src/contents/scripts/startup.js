const { ipcRenderer } = require('electron');

function load () {
  ipcRenderer.invoke('updateCustomMapDirectory')
    .then(() => {
      ipcRenderer.send('configLoaded');
      return window.close();
    })
    .catch((err) => ipcRenderer.send('flashError', err));
}

function loadRocketLeagueDirectory () {
  ipcRenderer.invoke('updateRocketLeagueDirectory')
    .then(() => window.close())
    .catch((err) => ipcRenderer.send('flashError', err));
}
