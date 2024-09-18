//var fs = require('fs');
//var fsp = require('fs/promises');
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
//var path = require('path')
import PermStore from './store.js'
import { EventEmitter } from "events";

//var PermStore = require('./store.js');
var permStore
class TranscribeService extends EventEmitter {
  constructor() {
    super()
    permStore = new PermStore({ secret: 'transcribe' , defaults: {'location': this.getDefaultLogLocation()}});

    }
// adds transcription to transcription log
  appendTextToLog(timestamp,text,user) {
  var logFile =  permStore.get('location')
  //generate file if it doesnt exist
  fs.stat(logFile, function(err, stat) {
    if (err == null) {
      console.log('File exists');
    } else if (err.code === 'ENOENT') {
      // file does not exist
      fs.writeFile(logFile, '');
    } 
  });

  var data = `[${timestamp}] ${user}: ${text}\n`

  fs.appendFile(logFile, data, (err) => {
    if (err) {
        console.log(err);
    } else {
      this.emit("passback",{name:"sendLogDataAppend", data:data})
    }

    });

  }

  getDefaultLogLocation(){
    var filePath =  path.join(process.env.APPDATA, "/heroaudiotranscriber/transcription.txt");
    console.log(filePath)
    return filePath

  }

  getLogLocation(){
    return permStore.get('location')
  }

  async updateLogFileLocation(newLocation){
  if (this.isLogLocationValid(newLocation)) {
    permStore.set('location',newLocation)
    return true
  } else{
    return false
    }
  }

  isLogLocationValid(location){
    var directory =path.parse(location).dir
    var base = path.basename(location)
    var basesplit = base.split('.')
    if (fs.existsSync(directory) && basesplit.length==2 && basesplit[1]=='txt' && basesplit[0].length>0) {
      return true
    } else return false
  }

  async loadfileText(){
    var loglocation = this.getLogLocation();
    if(this.isLogLocationValid(loglocation)){
      try{
        const data = await fsp.readFile(loglocation, { encoding: 'utf8' });
        var splitData = data.split('\n')
        splitData=splitData.slice(0,-1)

        return splitData
      } catch (err) {
        console.log(err);
        return 'no data'
      }
    }
  }
  async clearLog(){
    var logFile =  permStore.get('location')
    //generate file if it doesnt exist
    fs.stat(logFile, async function(err, stat) {
      if (err == null) {
        await fsp.writeFile(logFile, '')
      } 
    });
  }
}
const transcribeService = new TranscribeService();
export default transcribeService;