const fs = require('fs');
const path = require('path');
const os = require('os');
const _ = require('lodash');
const unzip = require('extract-zip');

const makeImagePath = (directoryContents, name, mapDirectory) => {
  const mapImageName = directoryContents.find((itemName) => (itemName.includes('.jpg') || itemName.includes('.png')));
  if (mapImageName === undefined) return undefined;
  return `${mapDirectory}/${name}/${mapImageName}`;
};

const buildMapObject = (mapDirectory) => (name, index) => {
  const directoryContents = fs.readdirSync(`${mapDirectory}/${name}`);
  const image = makeImagePath(directoryContents, name, mapDirectory);
  const file = directoryContents.find((itemName) => (itemName.includes('.udk') || itemName.includes('.upk')));
  const metaData = (fs.existsSync(`${mapDirectory}/${name}/info.json`))
    ? JSON.parse(fs.readFileSync(`${mapDirectory}/${name}/info.json`))
    : { author: null, desc: null };
  const { author, desc } = metaData;
  return {
    id: index,
    image,
    file,
    name,
    author,
    description: desc,
  };
};

const directoryFilter = (mapNames, directoryItem) => {
  if (directoryItem.isDirectory()) mapNames.push(directoryItem.name);
  return mapNames;
};

const buildMapArray = (mapDirectory) => {
  const directoryContents = fs.readdirSync(mapDirectory, { withFileTypes: true });
  const mapNames = directoryContents.reduce(directoryFilter, []);
  const maps = mapNames.map(buildMapObject(mapDirectory));
  return _.keyBy(maps, 'id');
};

const isValidMapFile = (filePath) => {
  if (path.extname(filePath) === '.cmap') return true;
  if (path.extname(filePath) === '.zip') return true;
  return false;
};

const makeMapDirectory = (mapDirectoryPath) => {
  if (fs.existsSync(mapDirectoryPath)) return null;
  return fs.mkdirSync(mapDirectoryPath);
};

const getMapInfoFromDirectory = (contents = []) => {
  if (contents.length < 3) return false;
  const image = contents.find((name) => (name.includes('.jpg') || name.includes('.png')));
  const mapFile = contents.find((name) => (name.includes('.upk') || name.includes('.udk')));
  const info = contents.find((name) => name === 'info.json');
  if (image && info && mapFile) return [image, info, mapFile];
  return false;
};

const getRealDirectoryContents = (directory) => {
  console.log(directory);
  const results = fs.readdirSync(directory);
  const files = getMapInfoFromDirectory(results);
  console.log(results.length);
  if (files && files.length) return { directory, files };
  if (results.length === 1) return getRealDirectoryContents(path.join(directory, results[0]));
  console.log(results);
  throw new Error('Invalid Map File!');
};

const importMap = async (importedMapPath, customMapDirectory) => {
  if (!isValidMapFile) throw new Error('Not a valid map file!');
  const { name: mapName } = path.parse(importedMapPath);
  const mapDirectoryPath = `${customMapDirectory}/${mapName}`;
  makeMapDirectory(mapDirectoryPath);
  const stagingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-'));
  const stagedFile = path.join(stagingDirectory, `${mapName}.zip`);
  const stagedContentDirectory = path.join(stagingDirectory, 'contents');
  fs.copyFileSync(importedMapPath, stagedFile);
  await unzip(stagedFile, { dir: stagedContentDirectory });
  const { files: mapFiles, directory: realDirectory } = getRealDirectoryContents(stagedContentDirectory);
  mapFiles.map((fileName) => fs.copyFileSync(path.join(realDirectory, fileName), path.join(mapDirectoryPath, fileName)));
  fs.rmdirSync(stagingDirectory, { maxRetries: 2, recursive: true });
  return null;
};

module.exports = {
  buildMapArray,
  importMap,
};
