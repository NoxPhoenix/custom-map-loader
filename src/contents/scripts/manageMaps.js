function loadMap (mapId) {
  return ipcRenderer.invoke('loadMap', mapId)
    .catch((err) => ipcRenderer.send('flashError', err));
}

function repairFiles () {
  return ipcRenderer.invoke('repairGameFiles')
    .catch((err) => ipcRenderer.send('flashError', err));
}

function setRocketLeagueFolder () {
  return ipcRenderer.invoke('updateRocketLeagueDirectory')
    .catch((err) => ipcRenderer.send('flashError', err));
}

function importNewMap () {
  return ipcRenderer.invoke('importMap')
    .catch((err) => ipcRenderer.send('flashError', err));
}

// function openWebsite () {
//   return ipcRenderer.send('openWebsite')
// }

function setCustomMapFolder () {
  return ipcRenderer.invoke('updateCustomMapDirectory')
    .then(() => $('[data-toggle="tooltip"]').tooltip('hide'))
    .then(() => makeCards())
    .catch((err) => ipcRenderer.send('flashError', err));
}

function openCustomMapFolder () {
  return ipcRenderer.send('openCustomMapFolder');
}
