const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electron', {
  // App info
  platform: process.platform,
  
  // Send messages to main process
  send: (channel, data) => {
    const validChannels = ['app:minimize', 'app:maximize', 'app:close'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Receive messages from main process
  receive: (channel, func) => {
    const validChannels = ['app:update-available'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});

// Log that preload script has loaded
console.log('Cosmos UI preload script loaded');

