// var openAI = require("openai");
// var config     = require('config');
// var fs = require('fs');
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

  async getCompletion(prompt) {
    openai
      const response = await this.openai.createCompletion({
      model: "gpt-4o-2024-05-13",
      prompt: prompt,
      max_tokens: 1024,
      temperature: 0.9,
      });
      return response
  }

  async getChatCompletion(prompt) {
    const completion = await this.openai.chat.completions.create({
      messages: prompt,
      model: "gpt-4o-2024-05-13",
    });
    return completion.choices[0].message.content
  }

  async getTextFromSpeech(audioFileLocation) {
    const transcription = await this.openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFileLocation),
      model: "whisper-1",
    });
    console.log(transcription.text)

    return transcription.text
  }

  async summarizeConversation(messages){
    messages.push(this.makeChatMessageFormat("user","Act as a Summarizer. Include all key events of the conversation. Keep it short. Don't tell me any details about yourself. Only include the summary."))
    var newMessages = []
    var summary = await this.getChatCompletion(messages)
    var summaryText = summary.data.choices[0].message.content.trim()

    newMessages.push(messages[0])
    newMessages.push(this.makeChatMessageFormat("assistant",summaryText))
    return newMessages
  }


  makeChatMessageFormat(role,content){
    return {"role": role, "content": content}
  }

  async regenerateOpenai(key){
    console.log(` new key is ${key}`)
    permStore.set('secretkey',key)
    this.openai= new openAI.OpenAI({
      apiKey: key
      });

    await this.testKey();

  }
  async testKey(){
      const list = await this.openai.models.list();
  }
}
export default OpenAIService;
//module.exports = { getCompletion, getChatCompletion, makeChatMessageFormat,getTextFromSpeech,summarizeConversation};