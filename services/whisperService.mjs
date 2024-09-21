import fs from 'fs';
import PermStore from './store.js';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import { dialog } from 'electron'
//const exec = promisify(execCallback);
const permStore = new PermStore({options:"--model tiny.en"});

class WhisperService {
  constructor() {
    this.child = null;
  }


  // uses whisper to listen to audio then transcribe it
  async getTextFromSpeech(audioFileLocation) {
    let cleanedText =""
    let options =permStore.get('options')
    //if(!options) options = '--model tiny.en'
    try{
      console.log(`whisper ${audioFileLocation} ${options} `)
      const { child, promise } = this.exec(`whisper ${audioFileLocation} ${options}`);
      this.child = child; // Store the child process

      const { stdout, stderr } = await promise;
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

  killProcess() {
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
  }

  // Custom exec function
  exec(command, options = {}) {
    let child;
    const promise = new Promise((resolve, reject) => {
      child = execCallback(command, options, (error, stdout, stderr) => {
        if (error) {
          // Attach stdout and stderr to the error object
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
    // Return both the child process and the promise
    return { child, promise };
  }
}
export default WhisperService;
