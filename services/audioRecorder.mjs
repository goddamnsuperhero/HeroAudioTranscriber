import portAudio from 'naudiodon'
import {FileWriter} from 'wav';
import PermStore from './store.js';
import transcriber from "./transcribeService.mjs"
import log from 'electron-log/main.js';
import fs from 'fs'
const permStore = new PermStore({ configName: 'user-preferences' , defaults: {'recordingLength': 5000, 'useOpenAI': true}});
const micNameMap = new Map();
const userMicList = new Map();
const audioRecorderList = new Map();
var recordingLength = 5000;

//var openai = new openAiService()
//var whisper = new WhisperService()
var openai;
var whisper;
var useOpenAI = false;
class AudioRecorder {

    constructor( openaiservice, whisperservice) {
        openai = openaiservice
        whisper = whisperservice
        this.loadMicData();
        if(permStore.has('recordingLength')) recordingLength = permStore.get('recordingLength');
        if(permStore.has('useOpenAI')) useOpenAI = permStore.get('useOpenAI');

        //this.updateTick()
    }

    // gets the list of mic names from the system
    getMicMap() {
        return micNameMap
    }
    // gets the list of saved mic data
    getSavedMicMap() {
        return userMicList
    }
    // gets the recording length
    getRecordingLength() {
        return recordingLength
    }
    // gets the recording length
    getWhisper() {
        return whisper
    }
    // loads the mic map if it doesn't already exist
    async loadMicMapIfEmpty() {
        if (this.isMicMapEmpty()) {
            console.log("gotta load them mics");
            await this.findMicMap();
        } else {
            console.log("mics not empty");
        }
    }

    // refresh system mics list
    async refreshMicList(){
        micNameMap.clear();
        permStore.set('micNameMap', Array.from(userMicList.entries())); 
        await this.findMicMap()
        
    }

    //checks if the micmap is empty
    isMicMapEmpty() {
        //console.log(micNameMap);
        return micNameMap.size === 0;
    }

    // Finds the list of mics on the system
    async findMicMap() {
        const devices = portAudio.getDevices();

        devices.forEach((device) => {
            const name = device.name;
            if (device.maxInputChannels > 0) {
                //console.log(name);
                micNameMap.set(name, device);
            }
        });
        permStore.set('micNameMap', Array.from(micNameMap.entries()));    
    }

    // this laods the mics from the save
    loadMicData() {
        const userMicNameList = permStore.get('micNameMap');
        if (userMicNameList) {
            userMicNameList.forEach(([key, value]) => micNameMap.set(key, value));
            console.log("Found old mic data")
        }
        const userMics = permStore.get('userMicList');
        if (userMics) {
            userMics.forEach(([key, value]) => {
                userMicList.set(key, value)
                if(value.uuid && value.micName){
                    this.spawnMic(value.uuid,value.micName,value.logname, value.micEnabled, value.time)
                }
             });
            console.log("Found old Mics added")
        }
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // updating recording length in seconds
    setRecordingLength(newLength){
        recordingLength = newLength*1000
        permStore.set('recordingLength', recordingLength);
    }

    //This spawns an existing mic from the data list with the values that already exist
    spawnMic(myUUID,micName,logname,micEnabled, time) {
        var mic = userMicList.get(`mic-${myUUID}`)
        mic.micName = micName
        mic.logname = logname
        mic.micEnabled = micEnabled
        mic.time = time
        audioRecorderList.set(myUUID,{recording:false,rollover:1})
        userMicList.set(`mic-${myUUID}`,mic)
        permStore.set('userMicList', Array.from(userMicList.entries())); 
        console.log(`Spawned mic for ${micName}`)
    }

    // creates a mic using the data
    updateMicData(data) {
        if(data.uuid) {
            console.log(data)
            var uuid = data.uuid
            var mic = userMicList.get(`mic-${uuid}`)
            if(data.micname){
                mic.micName = data.micname
            }
            if(data.logname){
                mic.logname = data.logname
            }
            if(data.micEnabled != null){
                mic.micEnabled = data.micEnabled
            }
            userMicList.set(`mic-${uuid}`,mic)
            permStore.set('userMicList', Array.from(userMicList.entries())); 
            console.log(`updated mic-${uuid}`)   
        } else {
            console.log("ERROR: no UUID")
        }
    }

    // removes a mic from the mic list
    deleteMic(data) {
        if(data.uuid) {
            var uuid = data.uuid
            userMicList.delete(`mic-${uuid}`) 
            audioRecorderList.delete(uuid)
            permStore.set('userMicList', Array.from(userMicList.entries())); 
        } else {
            console.log("ERROR: no UUID")
        }
    }

    // Generates a new mic with this UUID
    generateMicTab(myUUID){
        console.log("I am generating a single mic")
        var micData = {uuid:myUUID,time:Date.now(), micEnabled:true}
        userMicList.set(`mic-${myUUID}`,micData)
        permStore.set('userMicList', Array.from(userMicList.entries())); 
        audioRecorderList.set(myUUID,{recording:false,rollover:1})
        console.log(`added mic-${myUUID}`)   
        return micData
    }

    // starts a specific mic with the recording length
    async startMic(uuid,length){
        var recordingData =audioRecorderList.get(uuid)
        if(recordingData && !recordingData.recording){
            audioRecorderList.get(uuid).recording =true
            this.recordTimedMicAudio(uuid,length,1)
        }
    }

    //starts all the mics that are enabled at once
    async startMics(length){
        audioRecorderList.forEach((value, key) => {
            var mic = userMicList.get(`mic-${key}`)
            if(mic.micEnabled) this.startMic(key,length)
        })
    }

    // stops a specific mic once its done recording
    stopMic(uuid){
        audioRecorderList.get(uuid).recording = false
    }

    // stops all mics once they are done recording
    stopMics(){
        audioRecorderList.forEach((value, key) => {
            console.log(`stopping key: ${key}`)
            this.stopMic(key)
        })
    }
    // stops all mics once they are done recording
    setUsingOpenAI(useOpenAi){
        permStore.set('useOpenAI',useOpenAi); 
        console.log(permStore.get('useOpenAI'))

    }

    getUsingOpenAI(){ return permStore.get('useOpenAI')}


    // records a mic, saves to file, and transcribes
    async recordTimedMicAudio(uuid, length, rollover) {
        try{
            var mic = userMicList.get(`mic-${uuid}`)
            let foundDevice = micNameMap.get(mic.micName);

            if (!foundDevice) throw new Error("Microphone not found");

            const inputOptions =  {
                    inOptions: {
                        channelCount: 1,
                        sampleFormat: portAudio.SampleFormat16Bit,
                        sampleRate: foundDevice.defaultSampleRate,
                        deviceId: foundDevice.id,
                        closeOnError: true,
                    },
                };

            const ai = new portAudio.AudioIO(inputOptions);
            if (!fs.existsSync("./recordings")) {
                fs.mkdirSync("./recordings");
            }
            var fileLocation = `./recordings/${uuid}-${rollover}.wav`
            const outputFileStream = new FileWriter(fileLocation, {
                sampleRate: foundDevice.defaultSampleRate,
                channels: 1,
            });

            var timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            try {
                ai.pipe(outputFileStream);
                ai.start();
                console.log(`started recording ${uuid}-${rollover}.wav`);
    
                await this.sleep(length);
                ai.quit();
                console.log("finished recording");
            } catch (error) {
                log.error(error)
                console.error("Error recording audio: " + error);
            }
            this.rolloverRecord(uuid,length)
                var transcribedText =""
                if(useOpenAI){
                    transcribedText = await openai.getTextFromSpeech(fileLocation)
                } else {
                    transcribedText = await whisper.getTextFromSpeech(fileLocation) 
                }
                transcriber.appendTextToLog(timestamp,transcribedText,mic.logname)

            return `./${uuid}.wav`;
        } catch (error) {
            log.error(error)
        }
        // try {
        //     ai.pipe(outputFileStream);
        //     ai.start();
        //     console.log(`started recording ${uuid}-${rollover}.wav`);

        //     await this.sleep(length);
        //     ai.quit();
        //     console.log("finished recording");
        // } catch (error) {
        //     console.error("Error recording audio: " + error);
        // }
        // this.rolloverRecord(uuid,length)
        
        // var transcribedText =""
        // if(useOpenAI){
        //     transcribedText = await openai.getTextFromSpeech(fileLocation)
        // } else {
        //     transcribedText = await whisper.getTextFromSpeech(fileLocation) 
        // }
        // transcriber.appendTextToLog(timestamp,transcribedText,mic.logname)
        return `./${uuid}.wav`;
    }

    // updates a mic's rollover and start recording
    rolloverRecord(uuid,length){
        var recordingData =audioRecorderList.get(uuid)
        if(recordingData.recording){
            var newwavID = ((recordingData.rollover )%2) +1 
            audioRecorderList.get(uuid).rollover = newwavID
            this.recordTimedMicAudio(uuid,length,audioRecorderList.get(uuid).rollover)
        }
    }
}



export default AudioRecorder;