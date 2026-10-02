const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const outputDir = path.join(projectRoot, 'docs', 'images')
const entry = path.join(projectRoot, 'dist', 'index.html')

app.on('window-all-closed', () => {})

async function capture(name, options, hash = '') {
  const window = new BrowserWindow({
    ...options,
    show: false,
    frame: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  })
  await window.loadFile(entry, hash ? { hash } : undefined)
  await new Promise((resolve) => setTimeout(resolve, 800))
  const image = await window.webContents.capturePage()
  fs.writeFileSync(path.join(outputDir, name), image.toPNG())
  window.destroy()
}

app.whenReady().then(async () => {
  fs.mkdirSync(outputDir, { recursive: true })
  await capture('monitor.png', { width: 920, height: 92, transparent: true, backgroundColor: '#00000000' })
  await capture('settings.png', { width: 480, height: 700, backgroundColor: '#111318' }, '/settings')
  app.quit()
}).catch((error) => {
  console.error(error)
  app.exit(1)
})
