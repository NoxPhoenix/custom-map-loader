const { app } = require('electron');
const { ProgId, ShellOption, Regedit } = require('electron-regedit');

const ChildProcess = require('child_process');
const path = require('path');

const appFolder = path.resolve(process.execPath, '..');
const rootAtomFolder = path.resolve(appFolder, '..');
const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
const exeName = path.basename(process.execPath);

const spawn = function(command, args) {
  let spawnedProcess;

  try {
    spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
  } catch (error) {
    console.warn(error);
  }

  return spawnedProcess;
};

const spawnUpdate = function(args) {
  return spawn(updateDotExe, args);
};

const handleStartupEvent = async function() {
  if (process.platform !== 'win32') {
    return false;
  }

  const squirrelCommand = process.argv[1];
  console.log(process.argv[1]);
  switch (squirrelCommand) {
    case '--squirrel-install':
    case '--squirrel-updated':
       
      new ProgId({
        description: 'CMAPfiles',
        // progExt: '.cmap',
        // friendlyAppName: 'Custom Map Loader',
        icon: './installers/treasuremapmap_mapadeltesor_3940.ico',
        squirrel: true,
        extensions: ['cmap'],
        shell: [
            new ShellOption({ verb: ShellOption.OPEN, action: 'Import into Custom Map loader', command: `${process.execPath}`, args: ['--map', '%1'] }),
        ]
      });

      
      // Optionally do things such as:
      //
      // - Install desktop and start menu shortcuts
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus
      
      // Always quit when done
      spawnUpdate(['--createShortcut', exeName])
      Regedit.installAll()
        .then(app.quit);

      return true;
    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      
      // Always quit when done
      spawnUpdate(['--removeShortcut', exeName])
      
      Regedit.uninstallAll()
        .then(app.quit);

      return true;
    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated
      app.quit();
      return true;
  }
};

module.exports = handleStartupEvent;