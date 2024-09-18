//const { clear } = require("electron-json-storage");

var isRecording = false;
var length = 5;
var whisperSwitchBlock = false;
var secretkeyserialized ="".serialize;
async function initSettingsPage(){

    var myButton =  document.querySelector(`#settingsButton`);
    var closePopup =  document.querySelector(`#closeSettings`);
    myButton.addEventListener(
      "click",
      function () {
          myPopup.classList.add("show");
      }
      );
      closePopup.addEventListener(
          "click",
          function () {
              myPopup.classList.remove( 
                  "show"
              );
          }
      );
      window.addEventListener(
          "click",
          function (event) {
              if (event.target == myPopup) {
                  myPopup.classList.remove(
                      "show"
                  );
              }
          }
      );

  // init length field
  var lengthField =  document.querySelector(`#rLength`);
  lengthField.addEventListener("blur", function(event) {
    length =  lengthField.value
    window.electronAPI.sendData({name:'updateLength',data:{length:length}})
  });
  lengthField.value = length
    // init api field
    var apikeyfield =  document.querySelector(`#api-key`);
    apikeyfield.addEventListener("blur", function(event) {
      window.electronAPI.sendData({name:'updateApiKey',data:{key:apikeyfield.value}})
    });
    var logfilefield =  document.querySelector(`#log-location`);
    logfilefield.addEventListener("blur", function(event) {
      window.electronAPI.sendData({name:'updateLogLocation',data:{key:logfilefield.value}})
    });
    const openAICheckbox = document.querySelector(`#openAISwitch`)
    openAICheckbox.addEventListener('change', (event) => {

      if (event.currentTarget.checked) {
        whisperSwitch(true)
        window.electronAPI.sendData({name:'useOpenAi',data:{usOpenAI:false}})
      } else {
        window.electronAPI.sendData({name:'useOpenAi',data:{usOpenAI:true}})
        whisperSwitch(false)

      }
    })
    whisperSwitch(openAICheckbox.checked)

    var whisperOptionsField =  document.querySelector(`#whisper-options`);
    whisperOptionsField.addEventListener("blur", function(event) {
      window.electronAPI.sendData({name:'updateWhisperOptions',data:{key:whisperOptionsField.value}})
    });
}

  window.electronAPI.onDataReceived(async (event,data) => {
    if(data){
      console.log(data)
        if (data.name =="sendLength"){
            // length data gotten from save
            var lengthField =  document.querySelector(`#rLength`);
            lengthField.value = data.data
        } else if (data.name =="goodAPIKey"){
            // got word that api key is valid
            document.querySelector(`#apigood`).hidden= false;
            document.querySelector(`#apibad`).hidden=true;
            disableRecordingButton(false)
        } else if (data.name =="badAPIKey"){
            // got word that api key is invalid
            document.querySelector(`#apigood`).hidden= true;
            document.querySelector(`#apibad`).hidden=false;
            disableRecordingButton(true)
        } else if (data.name =="sendLogFileLocation"){
            // length data gotten from save
            var logfilefield =  document.querySelector(`#log-location`);
            logfilefield.value = data.data
        }else if (data.name =="goodLogLocation"){
            // got word that api key is valid
            document.querySelector(`#loggood`).hidden= false;
            document.querySelector(`#logbad`).hidden=true;
            disableRecordingButton(false)
        } else if (data.name =="badLogLocation"){
            // got word that api key is invalid
            document.querySelector(`#loggood`).hidden= true;
            document.querySelector(`#logbad`).hidden=false;
            disableRecordingButton(true)
        } else if (data.name =="useOpenAI"){
          usingWhisper = !data.data
          whisperSwitch(usingWhisper)
          const openAICheckbox = document.getElementById(`openAISwitch`)
          openAICheckbox.checked =usingWhisper
          console.log(data.data +" using whisper switch")
      }
        
    }
  });

  function whisperSwitch(isEnabled){
    var selectorLabelText =  document.querySelector(`#usingOpenAI`);
    var whisperDiv =  document.querySelector(`#useWhisperLocal`);
    var openAiDiv =  document.querySelector(`#useOpenAI`);

    if(!isEnabled){
        selectorLabelText.innerHTML="Using Open AI";
        whisperDiv.hidden = true;
        openAiDiv.hidden = false;

    } else {
        selectorLabelText.innerHTML="Using Whisper Local";
        whisperDiv.hidden = false;
        openAiDiv.hidden = true;
    }

  }