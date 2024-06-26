import openAI from 'openai';
import fs from 'fs';
import PermStore from './store.js';

const permStore = new PermStore({ secret: 'openai' , defaults: {'secretkey': ''}});

class OpenAIService {
  static openai;
  constructor() {

  this.openai = new openAI.OpenAI({
      apiKey: permStore.get('secretkey')
      });
  }

  // uses whisper to listen to audio then transcribe it
  async getTextFromSpeech(audioFileLocation) {
    const transcription = await this.openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFileLocation),
      model: "whisper-1",
    });
    console.log(transcription.text)

    return transcription.text
  }

  // updates openai to use your new key then tests it.
  async regenerateOpenai(key){
    permStore.set('secretkey',key)
    this.openai= new openAI.OpenAI({
      apiKey: key
      });

    await this.testKey();

  }
  // tests your openai key
  async testKey(){
      const list = await this.openai.models.list();
  }
}
export default OpenAIService;
