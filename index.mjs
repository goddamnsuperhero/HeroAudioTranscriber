import { app, BrowserWindow, ipcMain  } from 'electron'
//import audioRecorder from './services/audioRecorder.mjs';
import AudioRecorder from './services/audioRecorder.mjs'
import path from 'node:path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let returnMicCallback
const audioRecorder = new AudioRecorder();
let win;
const createWindow = () => {
    win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    })
    win.loadFile('index.html')
 }

  app.whenReady().then(() => {
    createWindow()
  })

  app.on('window-all-closed', () => {
      app.quit()
  })

  // loads when page is ready is ready
  ipcMain.on('document-ready', async (event) => {
    console.log("getting mics")
    await audioRecorder.loadMicMapIfEmpty()
    console.log("done")
    //win.webContents.send('fromMain', audioRecorder.micMap);

    event.sender.send('data-response',audioRecorder.getMicMap()); // Signal the renderer to update the dropdown

  })
  ipcMain.on('get-mic-data', (event) => {
    console.log(audioRecorder.micMap)
  })

