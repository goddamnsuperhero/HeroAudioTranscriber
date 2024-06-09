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

    event.sender.send('data-response',{name:'setMicDropdown',data: audioRecorder.getMicMap()}); // Signal the renderer to update the dropdown
    await sleep(100)
    event.sender.send('data-response',{name:'addSavedMics',data: audioRecorder.getSavedMicMap()}); // Signal the renderer to update the dropdown

    //event.sender.send('data-response')

  })
  ipcMain.on('get-mic-data', (event) => {
    //console.log(audioRecorder.micMap)
  })

  ipcMain.on('add-mic', (event) => {
    console.log("wahoo bing bing")

  })
  ipcMain.on('send-data', (event,arg) => {
    console.log("hit Event sendData")
    if(arg){
      if (arg.name === "addMic"){
        console.log("added a mic")
        console.log(arg.data)
        var mic = audioRecorder.generateMicTab(arg.data)
        event.sender.send('data-response',{name:'addNewMic',data: mic}); // Signal the renderer to update the dropdown
      } else if (arg.name === "clearMics"){
        audioRecorder.clearMicList()
      } else if (arg.name === 'updateMicValue'){
        audioRecorder.spawnMic(arg.data.uuid,arg.data.dropDownMic)
      } else if (arg.name === 'startMic'){
        audioRecorder.recordTimedMicAudio(arg.data,5000)
      } else if (arg.name === 'stopMic'){
        
      }
    }

  })

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
