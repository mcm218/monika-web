const { app, BrowserWindow, ipcMain } = require('electron')
const url = require("url");
const path = require("path");

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadFile("dist/monika/index.html");
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
  console.log(path);
  let authWindow = new BrowserWindow({ parent: mainWindow, show: false, height: 800, width: 1200 });
  authWindow.loadURL(path);
  authWindow.once("ready-to-show", () => {
    authWindow.show();
  });
  authWindow.on("closed", () => {
    console.log("Auth window closed");
    authWindow = null;
  });
}

ipcMain.on("openAuthWindow", (event, arg) => {
  openAuthWindow(arg);
})
