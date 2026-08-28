'use strict'

const path = require('node:path')
const {pathToFileURL} = require('node:url')
const {app, BrowserWindow, Menu, session, shell} = require('electron')
const {isAllowedExternalUrl, isTrustedAppUrl} = require('./navigation-policy.cjs')

const entryFile = path.join(__dirname, '..', 'dist', 'index.html')
const entryUrl = pathToFileURL(entryFile).href
let mainWindow = null

function openAllowedExternalUrl(url) {
  if (!isAllowedExternalUrl(url)) return false
  void shell.openExternal(url).catch(error => {
    console.error('無法開啟外部連結', error)
  })
  return true
}

function configureWebContents(contents) {
  contents.setWindowOpenHandler(({url}) => {
    openAllowedExternalUrl(url)
    return {action: 'deny'}
  })

  contents.on('will-navigate', (event, url) => {
    if (isTrustedAppUrl(url, entryUrl)) return
    event.preventDefault()
    openAllowedExternalUrl(url)
  })

  contents.on('will-attach-webview', event => {
    event.preventDefault()
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#111827',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  void mainWindow.loadFile(entryFile).catch(error => {
    console.error('無法載入應用程式', error)
    app.quit()
  })
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()
if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.on('web-contents-created', (_event, contents) => {
    configureWebContents(contents)
  })

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
    session.defaultSession.setPermissionCheckHandler(() => false)
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
