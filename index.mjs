import { app, BrowserWindow, ipcMain  } from 'electron'
import AudioRecorder from './services/audioRecorder.mjs'
import path from 'node:path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAIService from "./services/openAiService.mjs"
import transcribeService from "./services/transcribeService.mjs"
import WhisperService from "./services/whisperService.mjs"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const audioRecorder = new AudioRecorder();
let openai = new OpenAIService()
let whisper = new WhisperService()

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
    win.setMenuBarVisibility(false)

 }

  app.whenReady().then(() => {
    createWindow()

  })

  app.on('before-quit', () => {
    audioRecorder.getWhisper().killProcess()
    whisper.killProcess();
  });

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
    event.sender.send('data-response',{name:'sendLogFileLocation',data: transcribeService.getLogLocation()}); // Signal the renderer to update the dropdown
    console.log(audioRecorder.getUsingOpenAI())
    event.sender.send('data-response',{name:'useOpenAI', data:audioRecorder.getUsingOpenAI()}); 
    event.sender.send('data-response',{name:'modelOptions', data:audioRecorder.getUsingOpenAI()}); 
    //event.sender.send('data-response',{name:'useOpenAI', data:audioRecorder.getUsingOpenAI()}); 

    if(transcribeService.isLogLocationValid(transcribeService.getLogLocation())){
      event.sender.send('data-response',{name:'goodLogLocation'}); 
      var logData = await transcribeService.loadfileText()
      event.sender.send('data-response',{name:'sendLogData', data:logData}); 

    } else {
      event.sender.send('data-response',{name:'badLogLocation'}); 
    }
    transcribeService.loadfileText()
        
    await openai.testKey().then(() => {
      event.sender.send('data-response',{name:'goodAPIKey'}); 
      console.log("saved api key success")
      }).catch ((error)=> {
        event.sender.send('data-response',{name:'badAPIKey'}); 
        console.log(error)

      })
  })

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
      } else if (arg.name === 'updateLogLocation'){
        var result = await transcribeService.updateLogFileLocation(arg.data.key)
        if(result){
          event.sender.send('data-response',{name:'goodLogLocation'}); 
          var logData = await transcribeService.loadfileText()
          event.sender.send('data-response',{name:'sendLogData', data:logData}); 
          console.log("success")
        } else {
          event.sender.send('data-response',{name:'badLogLocation'}); 
          var logData = await transcribeService.loadfileText()
          event.sender.send('data-response',{name:'sendLogData', data:["No text found"]}); 
          console.log("Fail")
        }
      } else if (arg.name === 'refreshLog'){
        var result = await transcribeService.updateLogFileLocation(transcribeService.getLogLocation())
        if(result){
          var logData = await transcribeService.loadfileText()
          event.sender.send('data-response',{name:'sendLogData', data:logData}); 
        } else {
          var logData = await transcribeService.loadfileText()
          event.sender.send('data-response',{name:'sendLogData', data:["No text found"]}); 
        }
      } else if (arg.name === 'clearLog'){
        var result = await transcribeService.clearLog()
        event.sender.send('data-response',{name:'sendLogData', data:[""]}); 

      } else if (arg.name === 'event-passback'){
        var result = await transcribeService.clearLog()
        event.sender.send('data-response',arg.data); 
      } 
      else if (arg.name === 'useOpenAi'){
        var result = await audioRecorder.setUsingOpenAI(arg.data.usOpenAI)
      }
      else if (arg.name === 'updateWhisperOptions'){
        var result = await whisper.setOptions(arg.data.key)
      } 
    }

  })
  transcribeService.on("passback", (data) => {
    console.log("TrasncribePassback:"+data)
    win.webContents.send('data-response', data)
  });

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
