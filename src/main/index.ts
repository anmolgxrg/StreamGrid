import { app, shell, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.svg?asset'
import https from 'https'
import fs from 'fs/promises'
import path from 'path'
import type { SavedGrid, GridManifest } from '../shared/types/grid'

// Register custom protocol for Twitch embeds
protocol.registerSchemesAsPrivileged([
  { scheme: 'streamgrid', privileges: { secure: true, standard: true, corsEnabled: true } }
])

// Function to fetch latest GitHub release version
async function getLatestGitHubVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/LordKnish/StreamGrid/releases/latest',
      headers: {
        'User-Agent': 'StreamGrid'
      }
    }

    https
      .get(options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const release = JSON.parse(data)
            resolve(release.tag_name.replace('v', ''))
          } catch (err) {
            reject(err)
          }
        })
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

// Configure autoUpdater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

function checkForUpdates(): void {
  autoUpdater.checkForUpdates()
}

// Auto updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...')
})

autoUpdater.on('update-available', (info) => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Would you like to download it?`,
      buttons: ['Yes', 'No'],
      defaultId: 0
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
})

autoUpdater.on('update-not-available', () => {
  console.log('No updates available')
})

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err)
})

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`Download progress: ${progressObj.percent}%`)
})

autoUpdater.on('update-downloaded', (info) => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded. The application will now restart to install the update.`,
      buttons: ['Restart']
    })
    .then(() => {
      autoUpdater.quitAndInstall(false, true)
    })
})

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: true,
      webSecurity: false, // Disable web security to allow local file access
      allowRunningInsecureContent: true
    }
  })

  // Intercept Twitch embed requests to add parent parameter
  mainWindow.webContents.session.webRequest.onBeforeRequest(
    {
      urls: ['https://embed.twitch.tv/*channel=*']
    },
    (details, callback) => {
      let redirectURL = details.url

      const params = new URLSearchParams(redirectURL.replace('https://embed.twitch.tv/', ''))
      if (params.get('parent') != '') {
        callback({})
        return
      }
      params.set('parent', 'localhost')
      params.set('referrer', 'https://localhost/')

      redirectURL = 'https://embed.twitch.tv/?' + params.toString()
      console.log('Adjust Twitch embed URL to:', redirectURL)

      callback({
        cancel: false,
        redirectURL
      })
    }
  )

  // Remove CSP headers for Twitch embeds
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    {
      urls: ['https://www.twitch.tv/*', 'https://player.twitch.tv/*', 'https://embed.twitch.tv/*']
    },
    (details, callback) => {
      const responseHeaders = details.responseHeaders || {}

      console.log('Removing CSP headers for:', details.url)

      delete responseHeaders['Content-Security-Policy']
      delete responseHeaders['content-security-policy']

      callback({
        cancel: false,
        responseHeaders
      })
    }
  )

  // Remove Content Security Policy since we've disabled web security for local file access
  // This allows local files to be loaded without CSP restrictions

  // Add right-click menu for inspect element
  mainWindow.webContents.on('context-menu', (_, props): void => {
    const { x, y } = props
    const menu = require('electron').Menu.buildFromTemplate([
      {
        label: 'Inspect Element',
        click: (): void => {
          mainWindow.webContents.inspectElement(x, y)
        }
      }
    ])
    menu.popup()
  })

  // Add keyboard shortcut for DevTools
  mainWindow.webContents.on('before-input-event', (_, input): void => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools()
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Check for updates on app start
  if (!is.dev) {
    checkForUpdates()
    // Check for updates every hour
    setInterval(checkForUpdates, 60 * 60 * 1000)
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.streamgrid.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('get-app-version', (event) => {
    event.returnValue = app.getVersion()
  })

  // Add handler for getting latest GitHub version
  ipcMain.handle('get-github-version', async () => {
    try {
      return await getLatestGitHubVersion()
    } catch (error) {
      console.error('Error fetching GitHub version:', error)
      return null
    }
  })

  // Add handler for file dialog
  ipcMain.handle('show-open-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v', 'flv', 'wmv'] },
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      // Convert to file:// URL format
      const filePath = result.filePaths[0]
      const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`
      return { filePath, fileUrl }
    }
    return null
  })

  // Grid management setup
  await setupGridManagement()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Grid management setup function
async function setupGridManagement(): Promise<void> {
  const gridsDir = path.join(app.getPath('userData'), 'grids')
  const manifestPath = path.join(gridsDir, 'manifest.json')

  // Ensure grids directory exists
  await fs.mkdir(gridsDir, { recursive: true })

  // Initialize manifest if it doesn't exist
  try {
    await fs.access(manifestPath)
  } catch {
    const initialManifest: GridManifest = {
      version: '1.0.0',
      currentGridId: null,
      grids: []
    }
    await fs.writeFile(manifestPath, JSON.stringify(initialManifest, null, 2))
  }

  // Save grid handler
  ipcMain.handle('save-grid', async (_, grid: SavedGrid) => {
    try {
      const fileName = `${grid.id}.json`
      const filePath = path.join(gridsDir, fileName)

      // Save grid file
      await fs.writeFile(filePath, JSON.stringify(grid, null, 2))

      // Update manifest
      const manifestData = await fs.readFile(manifestPath, 'utf-8')
      const manifest: GridManifest = JSON.parse(manifestData)

      const existingIndex = manifest.grids.findIndex(g => g.id === grid.id)
      const gridInfo = {
        id: grid.id,
        name: grid.name,
        createdAt: grid.createdAt,
        lastModified: grid.lastModified,
        streamCount: grid.streams.length,
        fileName
      }

      if (existingIndex >= 0) {
        manifest.grids[existingIndex] = gridInfo
      } else {
        manifest.grids.push(gridInfo)
      }

      manifest.currentGridId = grid.id
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    } catch (error) {
      console.error('Error saving grid:', error)
      throw error
    }
  })

  // Load grid handler
  ipcMain.handle('load-grid', async (_, gridId: string) => {
    try {
      const filePath = path.join(gridsDir, `${gridId}.json`)
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data) as SavedGrid
    } catch (error) {
      console.error('Error loading grid:', error)
      return null
    }
  })

  // Delete grid handler
  ipcMain.handle('delete-grid', async (_, gridId: string) => {
    try {
      const filePath = path.join(gridsDir, `${gridId}.json`)
      await fs.unlink(filePath)

      // Update manifest
      const manifestData = await fs.readFile(manifestPath, 'utf-8')
      const manifest: GridManifest = JSON.parse(manifestData)
      manifest.grids = manifest.grids.filter(g => g.id !== gridId)

      if (manifest.currentGridId === gridId) {
        manifest.currentGridId = null
      }

      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    } catch (error) {
      console.error('Error deleting grid:', error)
      throw error
    }
  })

  // Rename grid handler
  ipcMain.handle('rename-grid', async (_, gridId: string, newName: string) => {
    try {
      const filePath = path.join(gridsDir, `${gridId}.json`)
      const data = await fs.readFile(filePath, 'utf-8')
      const grid: SavedGrid = JSON.parse(data)

      grid.name = newName
      grid.lastModified = new Date().toISOString()

      await fs.writeFile(filePath, JSON.stringify(grid, null, 2))

      // Update manifest
      const manifestData = await fs.readFile(manifestPath, 'utf-8')
      const manifest: GridManifest = JSON.parse(manifestData)
      const gridIndex = manifest.grids.findIndex(g => g.id === gridId)

      if (gridIndex >= 0) {
        manifest.grids[gridIndex].name = newName
        manifest.grids[gridIndex].lastModified = grid.lastModified
      }

      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    } catch (error) {
      console.error('Error renaming grid:', error)
      throw error
    }
  })

  // Get manifest handler
  ipcMain.handle('get-grid-manifest', async () => {
    try {
      const data = await fs.readFile(manifestPath, 'utf-8')
      return JSON.parse(data) as GridManifest
    } catch (error) {
      console.error('Error getting manifest:', error)
      return null
    }
  })

  // Get all grids handler
  ipcMain.handle('get-all-grids', async () => {
    try {
      const data = await fs.readFile(manifestPath, 'utf-8')
      const manifest: GridManifest = JSON.parse(data)
      return manifest.grids
    } catch (error) {
      console.error('Error getting all grids:', error)
      return []
    }
  })
}

// Add handler for save request from renderer
ipcMain.handle('request-save', async () => {
  // This will be called by the renderer when it needs to save
  return true
})

// Handle before-quit event to ensure saving
app.on('before-quit', async (event) => {
  // Send a message to all windows to save their state
  const windows = BrowserWindow.getAllWindows()
  if (windows.length > 0) {
    event.preventDefault()

    // Send save request to all windows
    for (const window of windows) {
      window.webContents.send('app-before-quit')
    }

    // Wait a bit for saves to complete
    setTimeout(() => {
      app.quit()
    }, 1000)
  }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
