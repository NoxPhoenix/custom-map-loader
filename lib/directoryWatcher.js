const fs = require('fs');

const makeWatcher = (directory) => fs.watch(directory);

const deleteWatcher = (watcher) => watcher.close();

module.exports = { makeWatcher, deleteWatcher };
