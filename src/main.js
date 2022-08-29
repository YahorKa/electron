// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const Buffer = require('buffer').Buffer;
global.ProgressBar = require('electron-progressbar');

var log_coll = [];
var raw_data = 0;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })
  // and load the index.html of the app. and remove menu
  mainWindow.loadFile(path.join(__dirname, 'index.html'))
  mainWindow.setMenu(null)
  // open dev tools
  //mainWindow.webContents.openDevTools()
}

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog()
  if (canceled) {
    return
  } else {
    return read_bin(filePaths[0]);
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(() => {
  ipc.handle('dialog:openFile', handleFileOpen)
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function read_bin(file_path) {

  BrowserWindow.getAllWindows()[0].webContents.send('progress-bar', 0, 100, 'подготавливаем файл')

  // let fd = fs.readFileSync(file_path).toString('hex')
  // for (var i = 0; i < fd.length; i += 2)
  //   array.push('0x' + fd[i] + '' + fd[i + 1])

  fs.readFile(file_path, 'hex', (err, data) => {
    if (err) { throw err; }
    raw_data = data;
    processFile(raw_data);
  })
}

function processFile(fd) {
  let array = [];
  let atom_array = [];
  for (var i = 0; i < fd.length; i += 2) {
    if (i % 100000 == 0) {
      BrowserWindow.getAllWindows()[0].webContents.send('progress-bar', i, fd.length, 'читаем данные')
    }
    array.push('0x' + fd[i] + '' + fd[i + 1])
  }
  for (byte in array) {
    atom_array.push(array[byte])
    if (byte % 100000 == 0) {
      // BrowserWindow.getAllWindows()[0].webContents.send('progress-bar', i, array.length, 'поиск атомных данных')
      BrowserWindow.getAllWindows()[0].webContents.send('progress-bar', byte, array.length, 'расшифровка данных')
    }
    if (array[byte] === '0xa3') {
      if (atom_array.length > 3) {
        if (find_atom(atom_array)) {
          array_to_json(atom_array.slice(3, -1))
        }
        atom_array = []
        atom_array.push(array[byte])

        // BrowserWindow.getAllWindows()[0].webContents.send('progress-bar', byte, array.length, 'расшифровка данных')
      }
      continue
    }
  }
  if (log_coll.length > 0) {
    BrowserWindow.getAllWindows()[0].webContents.send('update-map', log_coll)
  }
  log_coll = []
}

var find_atom = ((array) => {
  if (array[0] !== '0xa3') {
    return false
  }
  if (array[1] !== '0x95') {
    return false
  }
  if (array[2] !== '0x18') {
    return false
  }
  return true
})

function array_to_json(array) {
  //CHECK ATOM LOG
  if (array.length !== 40) return;
  //PARSE DATA FROM HEX_ARRAY
  let TimeUS = Buffer.from(array.slice(0, 8))
  let NormMD = Buffer.from(array.slice(8, 12))
  let NormMDe = Buffer.from(array.slice(12, 16))
  let MD04 = Buffer.from(array.slice(16, 20))
  let MD04e = Buffer.from(array.slice(20, 24))
  let MD11 = Buffer.from(array.slice(24, 28))
  let MD11e = Buffer.from(array.slice(28, 32))
  let lat = Buffer.from(array.slice(32, 36))
  let lon = Buffer.from(array.slice(36, 40))

  atom_obj = {
    TimeUS: TimeUS.readDoubleLE(),
    MD11: MD11.readFloatLE(),
    MD11e: MD11e.readFloatLE(),
    MD04: MD04.readFloatLE(),
    MD04e: MD04e.readFloatLE(),
    NormMD: NormMD.readFloatLE(),
    NormMDe: NormMDe.readFloatLE(),
    lat: lat.readInt32LE(),
    lon: lon.readInt32LE()
  }
  log_coll.push(atom_obj)
}