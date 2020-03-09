const { app, BrowserWindow, ipcMain } = require('electron')
const url = require("url");
const path = require("path");

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 750,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/monika/`),
      protocol: "file:",
      slashes: true
    })
  );
  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})


function openAuthWindow(path) {
  const { BrowserWindow } = require("electron");
  console.log(path);
  let authWindow = new BrowserWindow({ show: false, height: 600, width: 1200 });
  authWindow.loadURL(path);
  authWindow.once("ready-to-show", () => {
    authWindow.show();
  })
}

ipcMain.on("openAuthWindow", (event, arg) => {
  openAuthWindow(arg);
})
