var openAI = require("openai");
var config     = require('config');
var fs = require('fs');

const openai = new openAI.OpenAI({
    apiKey: config.get('openai.access'),
    });
  //const openai = new openAI.OpenAIApi(configuration);
  
async function getCompletion(prompt) {
  openai
    const response = await openai.createCompletion({
    model: "gpt-4o-2024-05-13",
    prompt: prompt,
    max_tokens: 1024,
    temperature: 0.9,
    });
    return response
}

async function getChatCompletion(prompt) {
  const completion = await openai.chat.completions.create({
    messages: prompt,
    model: "gpt-4o-2024-05-13",
  });
  return completion.choices[0].message.content
}

async function getTextFromSpeech(audioFileLocation) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFileLocation),
    model: "whisper-1",
  });
  console.log(transcription.text)

  return transcription.text
}

async function summarizeConversation(messages){
  messages.push(makeChatMessageFormat("user","Act as a Summarizer. Include all key events of the conversation. Keep it short. Don't tell me any details about yourself. Only include the summary."))
  var newMessages = []
  var summary = await getChatCompletion(messages)
  var summaryText = summary.data.choices[0].message.content.trim()

  newMessages.push(messages[0])
  newMessages.push(makeChatMessageFormat("assistant",summaryText))
  return newMessages
}


function makeChatMessageFormat(role,content){
  return {"role": role, "content": content}
}

module.exports = { getCompletion, getChatCompletion, makeChatMessageFormat,getTextFromSpeech,summarizeConversation};