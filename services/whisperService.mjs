import fs from 'fs';
import PermStore from './store.js';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import { dialog } from 'electron'
const exec = promisify(execCallback);
const permStore = new PermStore({options:"--model tiny.en"});

class WhisperService {
  constructor() {}


  // uses whisper to listen to audio then transcribe it
  async getTextFromSpeech(audioFileLocation) {
    let cleanedText =""
    let options =permStore.get('options')
    //if(!options) options = '--model tiny.en'
    try{
      console.log(`whisper ${audioFileLocation} ${options} `)
      const { stdout, stderr } = await exec(`whisper ${audioFileLocation} ${options} `);
      if(!stdout.startsWith('[')) throw ("Error using whisper, check your options")
      cleanedText = stdout.replace(/\[\d{2}:\d{2}\.\d{3} --\> \d{2}:\d{2}\.\d{3}\]/g, '').trim();
    
      // Remove any extra whitespace or newlines
      cleanedText = cleanedText.replace(/\s+/g, ' ');
      console.log(cleanedText);
    } catch (error){
      dialog.showErrorBox('ERROR',  error.message || String(error)) 
    }

    return cleanedText
  }

  // updates openai to use your new key then tests it.
  setOptions(key){
    permStore.set('options',key)
  }
}
export default WhisperService;
