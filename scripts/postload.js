

function initPostLoad(){
    var button = document.getElementById('spawnMic');

    button.addEventListener('click', async function() {
        var uuid = GlobalFuncs.uuidv4()
        window.electronAPI.sendData({name:'addMic',data:uuid})
    });

    var clearButton = document.getElementById('clearMics');

    clearButton.addEventListener('click', async function() {
        window.electronAPI.sendData({name:'clearMics'})
    });
    console.log("docuemnt is done loading")
}

  window.electronAPI.onDataReceived(async (event,data) => {
    if(data){
        if(data.name==="addSavedMics"){
        const micContainer = document.getElementById('micContainerRow');
        var micMap = new Map()
        micMap = data.data
        for (let [uuid, micData] of micMap.entries()) {
            addIndivdiualMic(micData)
            }
        } else if (data.name =="addNewMic"){
            addIndivdiualMic(data.data)
        }
    }
  });

  async function addIndivdiualMic(micData){
    try {
        if(micData && micData.uuid){
            await GlobalFuncs.fetchHtmlAsText('./html/micPage.html', micContainer, micData.uuid);
            initMicPage(micData.uuid);
            console.log(micData)
            if(micData.micName) document.querySelector(`#mic-dropdown-${micData.uuid}`).value = micData.micName;
        }
    } catch (error) {
        console.error(`Error processing mic entry`, error);
        // Handle the error appropriately
    }
  }