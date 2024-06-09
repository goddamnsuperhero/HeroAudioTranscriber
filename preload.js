const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  documentReady: () => ipcRenderer.send('document-ready'),
  getMicData: () => ipcRenderer.send('get-mic-data'),
  sendData: (data) => ipcRenderer.send('send-data', data),
  onDataReceived: (callback) => ipcRenderer.on('data-response', callback),
  addMic: (data) => ipcRenderer.send('add-mic', data),


})

