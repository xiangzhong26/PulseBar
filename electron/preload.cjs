const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pulsebar', {
  getMetrics: () => ipcRenderer.invoke('metrics:get'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('autolaunch:set', enabled),
  quit: () => ipcRenderer.send('app:quit'),
  minimize: () => ipcRenderer.send('window:minimize'),
  openSettings: () => ipcRenderer.send('window:settings'),
  openExternal: (url) => ipcRenderer.invoke('external:open', url),
  onSettings: (callback) => {
    const handler = (_event, settings) => callback(settings)
    ipcRenderer.on('settings:changed', handler)
    return () => ipcRenderer.removeListener('settings:changed', handler)
  },
})
