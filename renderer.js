  document.addEventListener('DOMContentLoaded', () => {
      // Request data from the main process when the page is loaded
      window.electronAPI.documentReady()

  });
  
  var micMap;
  window.electronAPI.onDataReceived(async (event,data) => {
    document.getElementById('loader').remove();
    const postLoadElements = document.getElementById('postload');
    await GlobalFuncs.fetchHtmlAsText('./html/postload.html',postLoadElements,null)
    initPostLoad()
    window.MyApp.globalData.micMap = data.data;
  });