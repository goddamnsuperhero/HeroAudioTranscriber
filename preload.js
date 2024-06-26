const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  documentReady: () => ipcRenderer.send('document-ready'),
  sendData: (data) => ipcRenderer.send('send-data', data),
  onDataReceived: (callback) => ipcRenderer.on('data-response', callback),
})

