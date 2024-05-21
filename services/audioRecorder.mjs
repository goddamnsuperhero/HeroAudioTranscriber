import portAudio from 'naudiodon';
import FileWriter from 'wav';
import AudioRecorderLib from 'node-audiorecorder';
import Store from 'electron-store';
import PermStore from './store.js';

const store = new Store();
const permStore = new PermStore({ configName: 'user-preferences' , defaults: {feelings: 'suicide', mood:'glum'}});

const micMap = new Map();

class AudioRecorder {
    constructor() {
        this.loadMicData();
    }

    getMicMap() {
        return micMap
    }
    async loadMicMapIfEmpty() {
        if (this.isMicMapEmpty()) {
            console.log("gotta load them mics");
            await this.findMicMap();
        } else {
            console.log("mics not empty");
        }
    }

    isMicMapEmpty() {
        console.log(micMap);
        return micMap.size === 0;
    }

    async findMicMap() {
        const devices = portAudio.getDevices();

        devices.forEach((device) => {
            const name = device.name;
            if (device.maxInputChannels > 0) {
                console.log(name);
                micMap.set(name, device);
            }
        });
        permStore.set('micMap', Array.from(micMap.entries()));    }

    loadMicData() {
        const data = permStore.get('micMap');
        if (data) {
            data.forEach(([key, value]) => micMap.set(key, value));
            console.log("Found old mic data")
        }
    }

    async recordAudio(micName, filename, length) {
        let foundDevice = micMap.get(micName);
        let isOutput = false;

        if (!foundDevice) {
            for (let device of portAudio.getDevices()) {
                if (device.name.includes(micName)) {
                    foundDevice = device;
                    micMap.set(micName, device);
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
        let foundDevice = micMap.get(micName);
        let isOutput = false;

        if (!foundDevice) {
            for (let device of portAudio.getDevices()) {
                if (device.name.includes(micName)) {
                    foundDevice = device;
                    isOutput = device.maxInputChannels === 0;
                    micMap.set(micName, device);
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
}

export default AudioRecorder;