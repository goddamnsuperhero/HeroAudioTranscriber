import portAudio from 'naudiodon';
import {FileWriter} from 'wav';
import Store from 'electron-store';
import PermStore from './store.js';
import openai from './openAiService.js';
import transcriber from './transcribeService.js';

const store = new Store();
const permStore = new PermStore({ configName: 'user-preferences' , defaults: {feelings: 'suicide', mood:'glum'}});

const micNameMap = new Map();
const userMicList = new Map();
const audioRecorderList = new Map();

class AudioRecorder {

    constructor() {
        this.loadMicData();
        this.updateTick()
    }

    getMicMap() {
        return micNameMap
    }
    getSavedMicMap() {
        return userMicList
    }
    async loadMicMapIfEmpty() {
        if (this.isMicMapEmpty()) {
            console.log("gotta load them mics");
            await this.findMicMap();
        } else {
            console.log("mics not empty");
        }
    }

    clearMicList(){
        userMicList.clear();
        permStore.set('userMicList', Array.from(userMicList.entries())); 
        permStore.set('micNameMap', Array.from(userMicList.entries())); 

    }

    isMicMapEmpty() {
        //console.log(micNameMap);
        return micNameMap.size === 0;
    }

    async findMicMap() {
        const devices = portAudio.getDevices();

        devices.forEach((device) => {
            const name = device.name;
            if (device.maxInputChannels > 0) {
                console.log(name);
                micNameMap.set(name, device);
            }
        });
        permStore.set('micNameMap', Array.from(micNameMap.entries()));    }

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
                    this.spawnMic(value.uuid,value.micName)
                }
             });
            console.log("Found old Mics added")
        }
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }


    spawnMic(myUUID,micName) {
        var mic = userMicList.get(`mic-${myUUID}`)
        mic.micName = micName
        audioRecorderList.set(myUUID,{recording:false,rollover:1})
        console.log(`${myUUID} is the mic dude`)
        userMicList.set(`mic-${myUUID}`,mic)
        permStore.set('userMicList', Array.from(userMicList.entries())); 
        console.log(`Spawned mic for ${micName}`)
    }

    generateMicTab(myUUID){
        console.log("I am generating a single mic")
        var micData = {uuid:myUUID}
        userMicList.set(`mic-${myUUID}`,micData)
        permStore.set('userMicList', Array.from(userMicList.entries())); 
        console.log(`added mic-${myUUID}`)   
        return micData
    }

    async startMic(uuid,length){
        var recordingData =audioRecorderList.get(uuid)
        if(recordingData && !recordingData.recording){
            audioRecorderList.get(uuid).recording =true
            this.recordTimedMicAudio(uuid,length,1)
        }
    }

    stopMic(uuid){
        audioRecorderList.get(uuid).recording = false
    }
    async recordTimedMicAudio(uuid, length, rollover) {

        var mic = userMicList.get(`mic-${uuid}`)
        let foundDevice = micNameMap.get(mic.micName);

        if (!foundDevice) throw new Error("Microphone not found");

        var isOutput = false

        console.log(`using ${foundDevice.name}`);
        console.log(`using sampleRate: ${foundDevice.defaultSampleRate}`);
        console.log(false);

        const inputOptions = isOutput
            ? {
                  outOptions: {
                      channelCount: foundDevice.maxOutputChannels,
                      sampleFormat: portAudio.SampleFormat16Bit,
                      sampleRate: foundDevice.defaultSampleRate,
                      deviceId: foundDevice.id,
                      closeOnError: true,
                  },
              }
            : {
                  inOptions: {
                      channelCount: 1,
                      sampleFormat: portAudio.SampleFormat16Bit,
                      sampleRate: foundDevice.defaultSampleRate,
                      deviceId: foundDevice.id,
                      closeOnError: true,
                  },
              };

        const ai = new portAudio.AudioIO(inputOptions);

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
            console.error("Error recording audio: " + error);
        }
        this.rolloverRecord(uuid,length)
        var transcribedText = await openai.getTextFromSpeech(fileLocation)
        transcriber.appendTextToLog(timestamp,transcribedText,"mic1")
        return `./${uuid}.wav`;
    }

    rolloverRecord(uuid,length){
        var recordingData =audioRecorderList.get(uuid)
        if(recordingData.recording){
            var newwavID = ((recordingData.rollover )%2) +1 
            audioRecorderList.get(uuid).rollover = newwavID
            this.recordTimedMicAudio(uuid,length,audioRecorderList.get(uuid).rollover)
        }
    }

    generateMicArray(uuid) {

        var mic = userMicList.get(`mic-${uuid}`)
        let foundDevice = micNameMap.get(mic.micName);

        if (!foundDevice) throw new Error("Microphone not found");

        var isOutput = false

        console.log(`using ${foundDevice.name}`);
        console.log(`using sampleRate: ${foundDevice.defaultSampleRate}`);
        console.log(false);

        const inputOptions = isOutput
            ? {
                  outOptions: {
                      channelCount: foundDevice.maxOutputChannels,
                      sampleFormat: portAudio.SampleFormat16Bit,
                      sampleRate: foundDevice.defaultSampleRate,
                      deviceId: foundDevice.id,
                      closeOnError: true,
                  },
              }
            : {
                  inOptions: {
                      channelCount: 1,
                      sampleFormat: portAudio.SampleFormat16Bit,
                      sampleRate: foundDevice.defaultSampleRate,
                      deviceId: foundDevice.id,
                      closeOnError: true,
                  },
              };

        var ai = new portAudio.AudioIO(inputOptions);
        //var ai2 = new portAudio.AudioIO(inputOptions);
        var ai2= ""

        const outputFileStream = new FileWriter(`./${uuid}-1.wav`, {
            sampleRate: foundDevice.defaultSampleRate,
            channels: 1,
        });
        const outputFileStream2 = new FileWriter(`./${uuid}-2.wav`, {
            sampleRate: foundDevice.defaultSampleRate,
            channels: 1,
        });

        var micArray = [{mic: ai, output:outputFileStream}, {mic: ai2, output:outputFileStream2}]
        return micArray;
    }

    async updateTick(){
        //console.log("tick")
        await this.sleep(500);
        this.updateTick();
    }
}



export default AudioRecorder;