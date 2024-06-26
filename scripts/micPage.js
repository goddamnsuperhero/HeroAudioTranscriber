function initMicPage(uuid){
        var uuid = uuid;
        var selectElement =  document.querySelector(`#mic-dropdown-${uuid}`);;

        updateMyDropdown(selectElement,window.MyApp.globalData.micMap)

  // Create a change listener specific to the current UUID.
      function changeListener(event) {
        var newValue = event.target.value;
        console.log(`${uuid} Select changed to: `, newValue);
        window.electronAPI.sendData({name:'updateMic',data:{uuid:uuid,micname:newValue}})

      }
      selectElement.addEventListener('change', changeListener);
      selectElement.changeListener = changeListener;

      // init delete mic button
      var deleteButton =  document.querySelector(`#delete-${uuid}`);;
      deleteButton.addEventListener('click', async function() {
        window.electronAPI.sendData({name:'deleteMic',data:{uuid:uuid}})
        var micCol =  document.querySelector(`#micCol-${uuid}`)
        micCol.remove()
      });

      // init log name field
      var lognameElement =  document.querySelector(`#logname-${uuid}`);
      lognameElement.addEventListener("blur", function(event) {
        window.electronAPI.sendData({name:'updateMic',data:{uuid:uuid,logname:lognameElement.value}})
      });

      // init enabled checkbox field
      const checkbox = document.getElementById(`isMicEnabled-${uuid}`)
      checkbox.addEventListener('change', (event) => {
        if (event.currentTarget.checked) {
          window.electronAPI.sendData({name:'updateMic',data:{uuid:uuid,micEnabled:true}})
        } else {
          window.electronAPI.sendData({name:'updateMic',data:{uuid:uuid,micEnabled:false}})

        }
      })

    }

    // updates all the drop down fields to use the new data
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

//   //i
// function initStartStopButtons(uuid){
//   var startButton =  document.querySelector(`#start-${uuid}`);;

//   startButton.addEventListener('click', async function() {
//     window.electronAPI.sendData({name:'startMic',data:uuid})
//   });
//   var stopButton =  document.querySelector(`#stop-${uuid}`);;

//   stopButton.addEventListener('click', async function() {
//     window.electronAPI.sendData({name:'stopMic',data:uuid})
//   });
// }