import { app, BrowserWindow, ipcMain  } from 'electron'
import AudioRecorder from './services/audioRecorder.mjs'
import path from 'node:path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAIService from "./services/openAiService.mjs"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const audioRecorder = new AudioRecorder();
let openai = new OpenAIService()
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
    event.sender.send('data-response',{name:'sendLength',data: audioRecorder.getRecordingLength()/1000}); // Signal the renderer to update the dropdown

    //event.sender.send('data-response')
    
    await openai.testKey().then(() => {
      event.sender.send('data-response',{name:'goodAPIKey'}); 
      console.log("saved api key success")
      }).catch ((error)=> {
        event.sender.send('data-response',{name:'badAPIKey'}); 
        console.log(error)

      })
  })
  // ipcMain.on('get-mic-data', (event) => {
  //   //console.log(audioRecorder.micMap)
  // })

  // ipcMain.on('add-mic', (event) => {
  //   console.log("wahoo bing bing")

  // })
  ipcMain.on('send-data', async (event,arg) => {
    console.log(`hit Event sendData ${arg.name}`)
    if(arg){
      if (arg.name === "addMic"){
        console.log("added a mic")
        console.log(arg.data)
        var mic = audioRecorder.generateMicTab(arg.data)
        event.sender.send('data-response',{name:'addNewMic',data: mic}); // Signal the renderer to update the dropdown
      } else if (arg.name === "refreshDropdown"){
        await audioRecorder.refreshMicList()
        event.sender.send('data-response',{name:'setMicDropdown',data: audioRecorder.getMicMap()}); // Signal the renderer to update the dropdown

      // } else if (arg.name === 'updateMicValue'){
      //   audioRecorder.spawnMic(arg.data.uuid,arg.data.micname)
      } else if (arg.name === 'updateMic'){
        audioRecorder.updateMicData(arg.data)
      } else if (arg.name === 'deleteMic'){
        audioRecorder.deleteMic(arg.data)
      } else if (arg.name === 'startMic'){
        await audioRecorder.startMic(arg.data,audioRecorder.getRecordingLength())
      } else if (arg.name === 'stopMic'){
        audioRecorder.stopMic(arg.data)
      } else if (arg.name === 'startMics'){
        await audioRecorder.startMics(audioRecorder.getRecordingLength())
      } else if (arg.name === 'stopMics'){
        audioRecorder.stopMics()
        await sleep(audioRecorder.getRecordingLength()+1000)
        event.sender.send('data-response',{name:'micsFinishedStopping'}); // Signal the renderer to update the dropdown
      } else if (arg.name === 'updateLength'){
        await audioRecorder.setRecordingLength(arg.data.length)
      } else if (arg.name === 'updateApiKey'){
        await openai.regenerateOpenai(arg.data.key).then(() => {
        event.sender.send('data-response',{name:'goodAPIKey'}); 
        console.log("success")
        }).catch ((error)=> {
          event.sender.send('data-response',{name:'badAPIKey'}); 
          console.log(error)

        })
      } 
    }

  })

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
