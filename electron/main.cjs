const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell } = require('electron')
const path = require('path')
const si = require('systeminformation')

let Store
let store
let mainWindow
let settingsWindow
let tray
let previousNetwork = null

const defaults = {
  modules: ['cpu', 'gpu', 'memory', 'network'],
  opacity: 0.92,
  scale: 1,
  interval: 1500,
  alwaysOnTop: true,
  compact: false,
  autoLaunch: false,
  networkInterface: 'auto',
  language: 'auto',
}

const BASE_WINDOW = { width: 920, height: 92 }

function resolvedLanguage() {
  const preferred = store?.get('language') || 'auto'
  if (preferred !== 'auto') return preferred
  return app.getLocale().toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

function labels() {
  return resolvedLanguage() === 'zh-CN'
    ? { toggle: '显示 / 隐藏', settings: '设置', quit: '退出 PulseBar', settingsTitle: '设置 · PulseBar' }
    : { toggle: 'Show / Hide', settings: 'Settings', quit: 'Quit PulseBar', settingsTitle: 'Settings · PulseBar' }
}

function applyMainWindowPreferences(resize = false) {
  if (!mainWindow) return
  const scale = Math.min(1.25, Math.max(0.75, Number(store.get('scale')) || 1))
  const height = Math.round(BASE_WINDOW.height * scale)
  mainWindow.setAlwaysOnTop(Boolean(store.get('alwaysOnTop')))
  mainWindow.webContents.setZoomFactor(scale)
  // Keep the translucent native window flush with the bar while still allowing horizontal resizing.
  mainWindow.setMinimumSize(Math.round(520 * scale), height)
  mainWindow.setMaximumSize(10000, height)
  if (resize) {
    mainWindow.setSize(Math.round(BASE_WINDOW.width * scale), height, true)
  }
}

function rendererUrl(route = '') {
  if (process.argv.includes('--dev')) return `http://localhost:5173/${route}`
  return `file://${path.join(__dirname, '../dist/index.html')}${route ? `#/${route}` : ''}`
}

function autoLaunchEnabled() {
  return app.isPackaged ? app.getLoginItemSettings().openAtLogin : store.get('autoLaunch')
}

function windowOptions() {
  const scale = Math.min(1.25, Math.max(0.75, Number(store.get('scale')) || 1))
  return {
    width: Math.round(BASE_WINDOW.width * scale),
    height: Math.round(BASE_WINDOW.height * scale),
    minWidth: Math.round(520 * scale),
    minHeight: Math.round(BASE_WINDOW.height * scale),
    maxHeight: Math.round(BASE_WINDOW.height * scale),
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: store.get('alwaysOnTop'),
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow(windowOptions())
  mainWindow.loadURL(rendererUrl())
  mainWindow.webContents.once('did-finish-load', () => applyMainWindowPreferences(false))
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.once('ready-to-show', () => {
    const area = screen.getPrimaryDisplay().workArea
    const [width] = mainWindow.getSize()
    mainWindow.setPosition(Math.round(area.x + (area.width - width) / 2), area.y + 18)
    mainWindow.show()
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }
  settingsWindow = new BrowserWindow({
    width: 480,
    height: 700,
    minWidth: 420,
    minHeight: 560,
    title: labels().settingsTitle,
    backgroundColor: '#111318',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  settingsWindow.loadURL(rendererUrl('settings'))
  settingsWindow.on('closed', () => { settingsWindow = null })
}

function createTray() {
  if (tray && !tray.isDestroyed()) tray.destroy()
  const icon = nativeImage.createFromDataURL(
    'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><path fill="white" d="M2 12h3l2-6 4 12 3-9 2 3h4v2h-5l-1-2-3 9L7 10l-1 4H2z"/></svg>').toString('base64')
  )
  tray = new Tray(icon.resize({ width: 18, height: 18 }))
  tray.setToolTip('PulseBar')
  const text = labels()
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: text.toggle, click: () => mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show() },
    { label: text.settings, click: createSettingsWindow },
    { type: 'separator' },
    { label: text.quit, click: () => app.quit() },
  ]))
  tray.on('click', () => mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show())
}

async function collectMetrics() {
  const [load, memory, graphics, networkStats, interfaces] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.graphics(),
    si.networkStats(),
    si.networkInterfaces(),
  ])

  const selected = store.get('networkInterface')
  const active = networkStats.find((item) => selected !== 'auto' ? item.iface === selected : item.operstate === 'up') || networkStats[0]
  const now = Date.now()
  let down = active?.rx_sec || 0
  let up = active?.tx_sec || 0
  if ((!down && !up) && active && previousNetwork?.iface === active.iface) {
    const seconds = Math.max((now - previousNetwork.time) / 1000, 0.1)
    down = Math.max(0, (active.rx_bytes - previousNetwork.rx) / seconds)
    up = Math.max(0, (active.tx_bytes - previousNetwork.tx) / seconds)
  }
  if (active) previousNetwork = { iface: active.iface, rx: active.rx_bytes, tx: active.tx_bytes, time: now }

  const controllers = graphics.controllers || []
  const gpuLoads = controllers.map((gpu) => Number(gpu.utilizationGpu)).filter(Number.isFinite)
  const gpuLoad = gpuLoads.length ? Math.max(...gpuLoads) : null
  const gpuMemoryUsed = controllers.reduce((total, gpu) => total + (Number(gpu.memoryUsed) || 0), 0)
  const gpuMemoryTotal = controllers.reduce((total, gpu) => total + (Number(gpu.memoryTotal) || 0), 0)
  const activeInterface = interfaces.find((item) => item.iface === active?.iface)
  const interfaceType = String(activeInterface?.type || '').toLowerCase()
  const friendlyType = interfaceType === 'wireless' ? 'Wi-Fi' : interfaceType === 'wired' ? 'Ethernet' : null
  const friendlyName = activeInterface?.ifaceName && activeInterface.ifaceName !== active?.iface ? activeInterface.ifaceName : null
  const networkLabel = friendlyType || friendlyName || (active?.iface?.startsWith('en') ? 'Network' : active?.iface)

  return {
    cpu: { value: Math.round(load.currentLoad || 0), temp: null },
    gpu: { value: gpuLoad == null ? null : Math.round(gpuLoad), memoryUsed: gpuMemoryUsed, memoryTotal: gpuMemoryTotal },
    memory: { value: Math.round((memory.active / memory.total) * 100), used: memory.active, total: memory.total },
    network: { down, up, iface: active?.iface || null, label: networkLabel || null },
    interfaces: interfaces.filter((item) => !item.internal).map((item) => ({ iface: item.iface, name: item.ifaceName || item.iface })),
    timestamp: now,
  }
}

app.whenReady().then(async () => {
  const { default: ElectronStore } = await import('electron-store')
  Store = ElectronStore
  store = new Store({ defaults })
  if (app.isPackaged && store.get('autoLaunch')) app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true })
  createMainWindow()
  createTray()
})

// This is a tray utility, so keep the process alive when all windows are hidden.
app.on('window-all-closed', () => {})
app.on('activate', () => mainWindow ? mainWindow.show() : createMainWindow())

ipcMain.handle('metrics:get', async () => {
  try { return await collectMetrics() } catch (error) { return { error: error.message, timestamp: Date.now() } }
})
ipcMain.handle('settings:get', () => ({ ...store.store, autoLaunch: autoLaunchEnabled(), systemLocale: app.getLocale() }))
ipcMain.handle('settings:update', (_event, values) => {
  const allowed = ['modules', 'opacity', 'scale', 'interval', 'alwaysOnTop', 'compact', 'networkInterface', 'language']
  for (const key of allowed) if (Object.hasOwn(values, key)) store.set(key, values[key])
  applyMainWindowPreferences(Object.hasOwn(values, 'scale'))
  if (Object.hasOwn(values, 'language')) {
    createTray()
    if (settingsWindow) settingsWindow.setTitle(labels().settingsTitle)
  }
  const settings = { ...store.store, systemLocale: app.getLocale() }
  mainWindow?.webContents.send('settings:changed', settings)
  return settings
})
ipcMain.handle('autolaunch:set', (_event, enabled) => {
  const value = Boolean(enabled)
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: value, openAsHidden: true })
  store.set('autoLaunch', value)
  return autoLaunchEnabled()
})
ipcMain.on('app:quit', () => app.quit())
ipcMain.on('window:minimize', () => mainWindow?.hide())
ipcMain.on('window:settings', createSettingsWindow)
ipcMain.handle('external:open', async (_event, value) => {
  try {
    const url = new URL(value)
    if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) return false
    await shell.openExternal(url.toString())
    return true
  } catch {
    return false
  }
})
