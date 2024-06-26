function initMicPage(uuid){
        var uuid = uuid;
        var selectElement =  document.querySelector(`#mic-dropdown-${uuid}`);;

        updateMyDropdown(selectElement,window.MyApp.globalData.micMap)

  // Create a change listener specific to the current UUID.
      function changeListener(event) {
        var newValue = event.target.value;
        console.log(`${uuid} Select changed to: `, newValue);
        //window.electronAPI.sendData({name:'updateMicValue',data:{uuid:uuid,dropDownMic:newValue}})
        window.electronAPI.sendData({name:'updateMic',data:{uuid:uuid,micname:newValue}})

      }

      selectElement.addEventListener('change', changeListener);
      selectElement.changeListener = changeListener;

      //initStartStopButtons(uuid)


      var deleteButton =  document.querySelector(`#delete-${uuid}`);;
      deleteButton.addEventListener('click', async function() {
        window.electronAPI.sendData({name:'deleteMic',data:{uuid:uuid}})
        var micCol =  document.querySelector(`#micCol-${uuid}`)
        micCol.remove()
      });

      var lognameElement =  document.querySelector(`#logname-${uuid}`);
      lognameElement.addEventListener("blur", function(event) {
        window.electronAPI.sendData({name:'updateMic',data:{uuid:uuid,logname:lognameElement.value}})
      });

      const checkbox = document.getElementById(`isMicEnabled-${uuid}`)

      checkbox.addEventListener('change', (event) => {
        if (event.currentTarget.checked) {
          window.electronAPI.sendData({name:'updateMic',data:{uuid:uuid,micEnabled:true}})
        } else {
          window.electronAPI.sendData({name:'updateMic',data:{uuid:uuid,micEnabled:false}})

        }
      })

    }

function updateMyDropdown(selector,dataItems) {
    const iterator1 = dataItems[Symbol.iterator]();
    selector.innerHTML = "";
    for (const item of iterator1) {
      const optionElement = document.createElement('option');
      optionElement.value = item[0];
      optionElement.textContent = item[0];
      selector.appendChild(optionElement);
    }
  }

function initStartStopButtons(uuid){
  var startButton =  document.querySelector(`#start-${uuid}`);;

  startButton.addEventListener('click', async function() {
    window.electronAPI.sendData({name:'startMic',data:uuid})
});
// Create a change listener specific to the current UUID.
var stopButton =  document.querySelector(`#stop-${uuid}`);;

stopButton.addEventListener('click', async function() {
  window.electronAPI.sendData({name:'stopMic',data:uuid})
});
}