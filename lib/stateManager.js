const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const unzip = require('extract-zip');

const { buildMapArray, importMap } = require('./customMaps');
const { makeWatcher, deleteWatcher } = require('./directoryWatcher');

const config = require(`${AppPath}/config.json`);

const state = { ...config, directoryWatcher: null };

const updateWatcher = (directory) => {
  if (!state.directoryWatcher) return makeWatcher(directory);
  deleteWatcher(state.directoryWatcher);
  state.directoryWatcher = makeWatcher(directory);
  return state.directoryWatcher;
};

const registerListener = (watcher) => {
  watcher.on('change', () => {
    const sendEvent = () => state.mainWindow.webContents.send('updateCards');
    setTimeout(sendEvent, 100);
  });
};

const getState = () => state;

const pathSuffix = '/TAGame/CookedPCConsole';
const hasTextures = (directory) => fs.existsSync(path.join(directory, pathSuffix, 'mods.upk'));

const copyTextures = (rocketLeagueDirectory) => {
  const workshopTexturesPath = path.normalize(`${AppData}/../workshop-textures.zip`);
  return unzip(workshopTexturesPath, { dir: path.join(rocketLeagueDirectory, pathSuffix) })
    .catch((err) => dialog.showMessageBoxSync({ title: 'error', message: `${err}` }));
};

const getFromState = (property) => {
  if (state[property]) return state[property];
  return undefined;
};

const setState = (newState) => Object.assign(state, newState);

const updateMapsStateFromDirectory = () => {
  const mapDirectory = state.customMapDirectory;
  const maps = buildMapArray(mapDirectory);
  Object.assign(state, { customMaps: maps });
  return maps;
};

const updateDirectoryWatcher = (directory) => {
  state.directoryWatcher = updateWatcher(directory);
  registerListener(state.directoryWatcher);
  updateMapsStateFromDirectory();
};

const updateCustomMapDirectory = () => {
  const [directoryPath] = dialog.showOpenDialogSync({ properties: ['openDirectory', 'dontAddToRecent'] }) || [null];
  if (!directoryPath) return null;
  const oldConfig = JSON.parse(fs.readFileSync(`${AppPath}/config.json`));
  fs.writeFileSync(`${AppPath}/config.json`, JSON.stringify({ ...oldConfig, customMapDirectory: directoryPath }));
  Object.assign(state, { customMapDirectory: directoryPath });
  updateDirectoryWatcher(directoryPath);
  return directoryPath;
};

const updateRocketLeagueDirectory = async () => {
  const [directoryPath] = dialog.showOpenDialogSync({ properties: ['openDirectory', 'dontAddToRecent'] }) || [null];
  if (!directoryPath) return null;
  if (!fs.existsSync(path.join(directoryPath, 'TAGame'))) throw new Error('Could not find Rocket League, make sure to select folder \'rocketleague\'');
  const oldConfig = JSON.parse(fs.readFileSync(`${AppPath}/config.json`));
  if (!hasTextures(directoryPath)) await copyTextures(directoryPath).catch((err) => { dialog.showMessageBoxSync({ title: 'Bad', message: `${err}` })});
  fs.writeFileSync(`${AppPath}/config.json`, JSON.stringify({ ...oldConfig, rocketLeagueDirectory: directoryPath }));
  Object.assign(state, { rocketLeagueDirectory: directoryPath });
  return directoryPath;
};

const manuallyImportMap = () => {
  const dialogOptions = {
    buttonLabel: 'Import Map',
    message: 'Select a valid .cmap or .zip file.',
    filters: [{ name: 'Custom Maps', extensions: ['cmap', 'zip'] }],
    properties: ['openFile'],
  };
  const [importingMapPath] = dialog.showOpenDialogSync(dialogOptions) || [null];
  if (!importingMapPath) return null;
  return importMap(importingMapPath, state.customMapDirectory);
};

if (state.customMapDirectory) updateDirectoryWatcher(state.customMapDirectory);

ipcMain.handle('getState', getState);

ipcMain.handle('getFromState', getFromState);

ipcMain.handle('setState', setState);

ipcMain.handle('updateMapsFromDirectory', updateMapsStateFromDirectory);

ipcMain.handle('updateCustomMapDirectory', updateCustomMapDirectory);

ipcMain.handle('updateRocketLeagueDirectory', updateRocketLeagueDirectory);

ipcMain.handle('importMap', manuallyImportMap);

ipcMain.on('flashError', (_, err) => dialog.showMessageBox({ title: 'Error', message: 'An error occurred', detail: `${err}` }));

// ipcMain.on('logDirs', () => dialog.showMessageBox({ title: 'dirs', message: 'Info', detail: `${argv.map}` }));

module.exports = {
  getState,
  getFromState,
  setState,
  updateMapsStateFromDirectory,
  updateCustomMapDirectory,
  updateRocketLeagueDirectory,
};
