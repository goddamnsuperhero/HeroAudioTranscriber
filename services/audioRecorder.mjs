import portAudio from 'naudiodon';
import {FileWriter} from 'wav';
import AudioRecorderLib from 'node-audiorecorder';
import Store from 'electron-store';
import PermStore from './store.js';
import fs from 'fs';
import Mic from 'node-microphone';

const store = new Store();
const permStore = new PermStore({ configName: 'user-preferences' , defaults: {feelings: 'suicide', mood:'glum'}});

const micNameMap = new Map();
const userMicList = new Map();
const audioRecorderList = new Map();

class AudioRecorder {

    constructor() {
        this.loadMicData();
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

    async recordAudio(micName, filename, length) {
        let foundDevice = micNameMap.get(micName);
        let isOutput = false;

        if (!foundDevice) {
            for (let device of portAudio.getDevices()) {
                if (device.name.includes(micName)) {
                    foundDevice = device;
                    micNameMap.set(micName, device);
                    break;
                }
            }
        }

        if (!foundDevice) throw new Error("Microphone not found");

        const deviceID = foundDevice.id;
        isOutput = foundDevice.maxInputChannels === 0;

        console.log(`using ${foundDevice.name}`);
        console.log(`using sampleRate: ${foundDevice.defaultSampleRate}`);
        console.log(isOutput);

        const inputOptions = isOutput
            ? {
                  outOptions: {
                      channelCount: foundDevice.maxOutputChannels,
                      sampleFormat: portAudio.SampleFormat16Bit,
                      sampleRate: foundDevice.defaultSampleRate,
                      deviceId: deviceID,
                      closeOnError: true,
                  },
              }
            : {
                  inOptions: {
                      channelCount: 1,
                      sampleFormat: portAudio.SampleFormat16Bit,
                      sampleRate: foundDevice.defaultSampleRate,
                      deviceId: deviceID,
                      closeOnError: true,
                  },
              };

        const ai = new portAudio.AudioIO(inputOptions);

        const outputFileStream = new FileWriter(`./${filename}.wav`, {
            sampleRate: foundDevice.defaultSampleRate,
            channels: 1,
        });

        try {
            ai.pipe(outputFileStream);
            ai.start();
            console.log("started recording");

            await this.sleep(length);
            ai.quit();
            console.log("finished recording");
        } catch (error) {
            console.error("Error recording audio: " + error);
        }

        return `./${filename}.wav`;
    }

    async recordAudioStart(micName, filename) {
        let foundDevice = micNameMap.get(micName);
        let isOutput = false;

        if (!foundDevice) {
            for (let device of portAudio.getDevices()) {
                if (device.name.includes(micName)) {
                    foundDevice = device;
                    isOutput = device.maxInputChannels === 0;
                    micNameMap.set(micName, device);
                    break;
                }
            }
        }

        if (!foundDevice) throw new Error("Microphone not found");

        console.log(`DEBUG: using ${foundDevice.name}`);
        console.log(`DEBUG: using sampleRate: ${foundDevice.defaultSampleRate}`);
        console.log(isOutput);

        recordingInput = new portAudio.AudioIO(
            isOutput
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
                  }
        );

        const outputFileStream = new FileWriter(`./${filename}.wav`, {
            sampleRate: foundDevice.defaultSampleRate,
            channels: 1,
        });

        recordingInput.pipe(outputFileStream);
        recordingInput.start();
        console.log("DEBUG: started recording");

        isRecord = true;
        recordingFilename = filename;
    }

    async recordAudioEnd() {
        recordingInput.quit();
        console.log("finished recording");

        return `./${recordingFilename}.wav`;
    }

    async recordAudioFromMic(micName, filename, length) {
        let foundDevice;
        const devices = portAudio.getDevices();
        let isOutput = false;

        for (let device of devices) {
            if (device.name.includes(micName)) {
                foundDevice = device;
                isOutput = device.maxInputChannels === 0;
            }
        }

        if (!foundDevice) throw new Error("Microphone not found");

        const options = {
            program: `sox`,
            device: `hw:0,${foundDevice.id}`,
            bits: 16,
            channels: 1,
            encoding: `signed-integer`,
            format: `S16_LE`,
            rate: foundDevice.defaultSampleRate,
            type: `wav`,
            silence: 2,
            thresholdStart: 0.5,
            thresholdStop: 0.5,
            keepSilence: true,
        };

        const logger = console;
        const audioRecorder = new AudioRecorderLib(options, logger);

        const outputFileStream = new FileWriter(`./${filename}.wav`, {
            sampleRate: foundDevice.defaultSampleRate,
            channels: numChannels,
        });

        audioRecorder.on('error', console.warn);
        audioRecorder.on('end', () => {
            console.warn('Recording ended.');
        });

        audioRecorder.start().stream().pipe(outputFileStream);
        console.log("started recording");

        await this.sleep(length);
        audioRecorder.stop();
        console.log("finished recording");

        return `./${filename}.wav`;
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }


    spawnMic(myUUID,micName) {
        let foundDevice = micNameMap.get(micName);
        console.log("")

            const devices = portAudio.getDevices();

            const options = {
                program: `sox`,
                device: `hw:0,${foundDevice.id}`,
                bits: 16,
                channels: 1,
                encoding: `signed-integer`,
                format: `S16_LE`,
                rate: foundDevice.defaultSampleRate,
                type: `wav`,
                silence: 2,
                thresholdStart: 0.5,
                thresholdStop: 0.5,
                keepSilence: true,
            };

            const logger = console;
            const audioRecorder = new AudioRecorderLib(options, logger);

            audioRecorder.on('error', console.warn);
            audioRecorder.on('end', () => {
                console.warn('Recording ended.');
            });

            var mic = userMicList.get(`mic-${myUUID}`)
            mic.micName = micName
            audioRecorderList.set(myUUID,audioRecorder)
            console.log(`${myUUID} is the mic dude`)
            userMicList.set(`mic-${myUUID}`,mic)
            permStore.set('userMicList', Array.from(userMicList.entries())); 
            console.log(`Spawned mic for ${micName}`)

            //console.log(mic)
    }

    generateMicTab(myUUID){
        console.log("I am generating a single mic")
        var micData = {uuid:myUUID}
        userMicList.set(`mic-${myUUID}`,micData)
        permStore.set('userMicList', Array.from(userMicList.entries())); 
        console.log(`added mic-${myUUID}`)   
        return micData
    }

    async recordTimedMicAudio(uuid, length) {

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

        const outputFileStream = new FileWriter(`./${uuid}.wav`, {
            sampleRate: foundDevice.defaultSampleRate,
            channels: 1,
        });

        try {
            ai.pipe(outputFileStream);
            ai.start();
            console.log("started recording");

            await this.sleep(length);
            ai.quit();
            console.log("finished recording");
        } catch (error) {
            console.error("Error recording audio: " + error);
        }

        return `./${uuid}.wav`;
    }

    //     let audioRecorder = new AudioRecorderLib(options, console);

    //     // Create a write stream to write out to a raw audio file.
    //     let fileStream = fs.createWriteStream('output.wav', { encoding: 'binary' });
        
    //     // Start and stop recording after 3 seconds.
    //     audioRecorder.start().stream().pipe(fileStream);
    //     setTimeout(() => {
    //       audioRecorder.stop();
    //     }, 10000);
    //     return `./${uuid}.wav`;
    // }
}



export default AudioRecorder;