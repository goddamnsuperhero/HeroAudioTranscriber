
  document.addEventListener('DOMContentLoaded', () => {
      // Request data from the main process
      console.log("i am here")
      window.electronAPI.documentReady()

  });
  
  //document.getElementById('cancel').addEventListener('click', test)
  window.electronAPI.onDataReceived(async (event,data) => {
    console.log(`Received message from main: ${data}`);
    const postLoadElements = document.getElementById('postload');
    document.getElementById('loader').remove();
    postLoadElements.innerHTML = await fetchHtmlAsText("html\\postload.html");
    updateMyDropdown(data);
  });
  
  function updateMyDropdown(dataItems) {
    const dropdownElement = document.getElementById('mic-dropdown');
    const iterator1 = dataItems[Symbol.iterator]();
    dropdownElement.innerHTML = "";
    for (const item of iterator1) {
      const optionElement = document.createElement('option');
      optionElement.value = item[0];
      optionElement.textContent = item[0];
      dropdownElement.appendChild(optionElement);
    }
}

async function fetchHtmlAsText(url) {
  const response = await fetch(url);
  return await response.text();
}