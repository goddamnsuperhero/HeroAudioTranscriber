//const { clear } = require("electron-json-storage");

var isRecording = false;
var length = 5;

async function initPostLoad(){

    var settingsMenu =  document.querySelector(`#settingsMenu`);
    await GlobalFuncs.fetchHtmlAsText('./html/settingsMenu.html', settingsMenu);
    initSettingsPage()


    // init add mic button
    var button = document.getElementById('spawnMic');
    button.addEventListener('click', async function() {
        var uuid = GlobalFuncs.uuidv4()
        window.electronAPI.sendData({name:'addMic',data:uuid})
    });
    // init refresh dropdown button
    var clearButton = document.getElementById('refreshDropdown');
    clearButton.addEventListener('click', async function() {
        window.electronAPI.sendData({name:'refreshDropdown'})
    });
    // init start Button 
    var startButton =  document.querySelector(`#ToggleRecording`);
    startButton.addEventListener('click', async function() {
        if(!isRecording){
            window.electronAPI.sendData({name:'startMics',length:length})
            startButton.textContent = "Stop Recording"
            startButton.classList.add("btn-danger");
            startButton.classList.remove("btn-success");
            localStorage.setItem('isRecording',true);
        } else {
            window.electronAPI.sendData({name:'stopMics'})
            document.querySelector(`#stopWaitLoader`).hidden = false
        }
        
        isRecording = !isRecording;
        if(isRecording) disableAllMicElements(isRecording)
  });
//   var myButton =  document.querySelector(`#myButton`);
//   var closePopup =  document.querySelector(`#closePopup`);
//   myButton.addEventListener(
//     "click",
//     function () {
//         myPopup.classList.add("show");
//     }
//     );
//     closePopup.addEventListener(
//         "click",
//         function () {
//             myPopup.classList.remove( 
//                 "show"
//             );
//         }
//     );
//     window.addEventListener(
//         "click",
//         function (event) {
//             if (event.target == myPopup) {
//                 myPopup.classList.remove(
//                     "show"
//                 );
//             }
//         }
//     );
    var LogPreviewButton =  document.querySelector(`#LogButton`);
    var closeLogPreviewPopup =  document.querySelector(`#closeTextPreviewPopup`);
    var RefreshLogButton =  document.querySelector(`#refreshLog`);
    var ClearLog =  document.querySelector(`#clearLog`);

    LogPreviewButton.addEventListener(
      "click",
      function () {
        myPopupTextPreview.classList.add("show");
      }
      );
      closeLogPreviewPopup.addEventListener(
          "click",
          function () {
            myPopupTextPreview.classList.remove( 
                  "show"
              );
          }
      );
      window.addEventListener(
          "click",
          function (event) {
              if (event.target == myPopup) {
                myPopupTextPreview.classList.remove(
                      "show"
                  );
              }
          }
      );
      RefreshLogButton.addEventListener(
        "click",
        function () {
            window.electronAPI.sendData({name:'refreshLog'})
            

        }
    );
    ClearLog.addEventListener(
        "click",
        function () {
            window.electronAPI.sendData({name:'clearLog'})
        }
    );
}

  window.electronAPI.onDataReceived(async (event,data) => {
    if(data){
        if(data.name==="addSavedMics"){
            // adds all the saved mics
            var micMap = new Map()
            micMap = data.data
            var micArray = Array.from(micMap.values())
            micArray = micArray.sort(function (a, b) {
                if (a.time == null && b.time == null) return 0;
                if (a.time == null) return 1;
                if (b.time == null) return -1;
                return a.time - b.time;
            });
            for (let micData of micArray) {
                await addIndivdiualMic(micData)
                }
        } else if (data.name =="addNewMic"){
            // adds a new mic
            await addIndivdiualMic(data.data)
        } else if (data.name =="micsFinishedStopping"){
            // once mics are done, toggle recording
            await disableAllMicElements(false)
            var startButton =  document.querySelector(`#ToggleRecording`);
            startButton.textContent = "Start Recording"
            startButton.classList.add("btn-success");
            startButton.classList.remove("btn-danger");
            localStorage.setItem('isRecording',false);
            document.querySelector(`#stopWaitLoader`).hidden = true
        } else if (data.name =="sendLogData"){
            // got word that api key is invalid
            var textLines = data.data
            var textPreview = document.querySelector(`#TextPreview`)
            textPreview.innerHTML =""
            for( textLine in textLines){
                var para = document.createElement("p");
                var node = document.createTextNode(textLines[textLine]);
                para.appendChild(node);
                textPreview.appendChild(para);
            }

        }
        else if (data.name =="sendLogDataAppend"){
            // got word that api key is invalid
            var textLines = data.data
            var textPreview = document.querySelector(`#TextPreview`)
            var para = document.createElement("p");
            var node = document.createTextNode(textLines);
            para.appendChild(node);
            textPreview.appendChild(para);
        }
    }
  });

  // adds a new mic page to the container
  async function addIndivdiualMic(micData){
    try {
        if(micData && micData.uuid){
            const micContainer = document.getElementById('micContainerRow');

            await GlobalFuncs.fetchHtmlAsText('./html/micPage.html', micContainer, micData.uuid,"micCol","col-xs");
            initMicPage(micData.uuid);
            if(micData.micName) document.querySelector(`#mic-dropdown-${micData.uuid}`).value = micData.micName;
            if(micData.logname) document.querySelector(`#logname-${micData.uuid}`).value = micData.logname;
            if(micData.micEnabled != null) document.querySelector(`#isMicEnabled-${micData.uuid}`).checked = micData.micEnabled;
        }
    } catch (error) {
        console.error(`Error processing mic entry`, error);
        // Handle the error appropriately
    }
  }

  // prevent changing settings while recording
  function disableAllMicElements(isEnabled){
    var elements = document.querySelectorAll(".micPage *, #spawnMic, #refreshDropdown");
    elements.forEach(function(element) {
        if(!isEnabled){
            element.classList.remove("disabled");
            element.disabled = false
        } else {
            element.classList.add("disabled");
            element.disabled = true
        }
      });
  }
  // prevent recording with bad api key
  function disableRecordingButton(isEnabled){
    var elements = document.querySelectorAll("#ToggleRecording");
    elements.forEach(function(element) {
        if(!isEnabled){
            element.classList.remove("disabled");
            element.disabled = false
        } else {
            element.classList.add("disabled");
            element.disabled = true
        }
      });
  }