function loadMap (mapId) {
  $(`#card-${mapId} .card-overlay`).css('display', 'flex');
  return ipcRenderer.invoke('loadMap', mapId)
    .then((mapName) => {
      $('#toast-body').text(`${mapName} successfully loaded into Rocket League!`);
      $(`#card-${mapId} .card-overlay`).hide();
      $('.toast').toast('show');
    })
    .catch((err) => ipcRenderer.send('flashError', err));
}

function repairFiles () {
  return ipcRenderer.invoke('repairGameFiles')
    .then((mapName) => {
      $('#toast-body').text('Original map files successfully re-loaded back into Rocket League!');
      $('.toast').toast('show');
    })
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
