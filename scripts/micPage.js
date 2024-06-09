function initMicPage(uuid){
        var uuid = uuid;
        var selectElement =  document.querySelector(`#mic-dropdown-${uuid}`);;

        updateMyDropdown(selectElement,window.MyApp.globalData.micMap)

  // Create a change listener specific to the current UUID.
      function changeListener(event) {
        var newValue = event.target.value;
        console.log(`${uuid} Select changed to: `, newValue);
        window.electronAPI.sendData({name:'updateMicValue',data:{uuid:uuid,dropDownMic:newValue}})
      }

      selectElement.addEventListener('change', changeListener);
      selectElement.changeListener = changeListener;

      initStartStopButtons(uuid)

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