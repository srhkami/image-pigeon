'use strict'

const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('imagePigeonDesktop', Object.freeze({
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
}))
