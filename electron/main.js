const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const isDev = !app.isPackaged

let serverProcess = null

function startServer() {
  console.log('Запуск сервера...')
  
  const serverPath = path.join(__dirname, '../server/index.js')
  serverProcess = spawn('node', [serverPath], {
    stdio: 'pipe',
    cwd: path.join(__dirname, '..')
  })

  serverProcess.stdout.on('data', (data) => {
    console.log(`Сервер: ${data.toString()}`)
  })

  serverProcess.stderr.on('data', (data) => {
    console.error(`Ошибка сервера: ${data.toString()}`)
  })

  serverProcess.on('close', (code) => {
    console.log(`Сервер завершен с кодом ${code}`)
  })

  // Даем серверу время на запуск
  return new Promise((resolve) => {
    setTimeout(resolve, 2000)
  })
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Всегда загружаем собранную версию
  const htmlPath = path.join(__dirname, '../dist/index.html')
  mainWindow.loadFile(htmlPath)
  
  // Открываем DevTools только в режиме разработки
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(async () => {
  // Запускаем сервер перед созданием окна
  await startServer()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  // Завершаем сервер при закрытии приложения
  if (serverProcess) {
    serverProcess.kill()
  }
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  // Завершаем сервер при выходе из приложения
  if (serverProcess) {
    serverProcess.kill()
  }
}) 