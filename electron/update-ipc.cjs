'use strict'

const {isTrustedAppUrl} = require('./navigation-policy.cjs')
const {checkForUpdates} = require('./update-check.cjs')

function registerUpdateCheck({ipcMain, getWindow, entryUrl, currentVersion, check = checkForUpdates}) {
  let pending
  ipcMain.handle('updates:check', async (event, ...args) => {
    try {
      const window = getWindow()
      if (args.length !== 0 || !window || event.sender !== window.webContents
        || !event.senderFrame || event.senderFrame !== window.webContents.mainFrame
        || !isTrustedAppUrl(event.senderFrame.url, entryUrl)) return {status: 'unavailable'}
      // 整個程序只查一次，避免重掛載與並行 IPC 重複連線。
      pending ??= Promise.resolve().then(() => check(currentVersion)).catch(() => ({status: 'unavailable'}))
      return await pending
    } catch {
      return {status: 'unavailable'}
    }
  })
}

module.exports = {registerUpdateCheck}
