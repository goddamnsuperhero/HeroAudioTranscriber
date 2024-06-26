  document.addEventListener('DOMContentLoaded', () => {
      // Request data from the main process when the page is loaded
      window.electronAPI.documentReady()

  });
  
  var micMap;
  //document.getElementById('cancel').addEventListener('click', test)
  window.electronAPI.onDataReceived(async (event,data) => {
    //console.log(data)
    // if(data && data.name==="setMicDropdown")
    // console.log(`Received message from main: ${data.data}`);
    document.getElementById('loader').remove();
    const postLoadElements = document.getElementById('postload');
    //postLoadElements.innerHTML = GlobalF fetchHtmlAsText("./html/postload.html");
    //console.log(postLoadElements)
    await GlobalFuncs.fetchHtmlAsText('./html/postload.html',postLoadElements,null)
    initPostLoad()
    window.MyApp.globalData.micMap = data.data;
    //updateMyDropdown(data);
  });