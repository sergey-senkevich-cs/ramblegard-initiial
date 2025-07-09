const http = require('http')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const PORT = 3001
const DB_PATH = path.join(__dirname, 'database.sqlite')

// Инициализация базы данных
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Ошибка подключения к базе данных:', err)
        reject(err)
        return
      }
      console.log('Подключение к SQLite базе данных установлено')
    })

    // Создание таблицы пользователей
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Ошибка создания таблицы:', err)
        reject(err)
        return
      }
      console.log('Таблица пользователей готова')
      resolve(db)
    })
  })
}

// Функции для работы с базой данных
function getAllUsers(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

function getUserById(db, id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

function createUser(db, userData) {
  return new Promise((resolve, reject) => {
    const { name, email } = userData
    const id = uuidv4()
    
    db.run('INSERT INTO users (id, name, email) VALUES (?, ?, ?)', 
      [id, name, email], 
      function(err) {
        if (err) {
          reject(err)
        } else {
          // Получаем созданного пользователя
          db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) {
              reject(err)
            } else {
              resolve(row)
            }
          })
        }
      })
  })
}

function updateUser(db, id, userData) {
  return new Promise((resolve, reject) => {
    const { name, email } = userData
    
    db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', 
      [name, email, id], 
      function(err) {
        if (err) {
          reject(err)
        } else {
          if (this.changes === 0) {
            resolve(null) // Пользователь не найден
          } else {
            // Получаем обновленного пользователя
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
              if (err) {
                reject(err)
              } else {
                resolve(row)
              }
            })
          }
        }
      })
  })
}

function deleteUser(db, id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err)
      } else {
        resolve(this.changes)
      }
    })
  })
}

function getUsersCount(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row.count)
      }
    })
  })
}

// Обработка CORS
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// Парсинг JSON из тела запроса
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
  })
}

// Отправка JSON ответа
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// Создание HTTP сервера
async function createServer() {
  const db = await initDatabase()

  const server = http.createServer(async (req, res) => {
    setCorsHeaders(res)

    // Обработка preflight запросов
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    const url = new URL(req.url, `http://localhost:${PORT}`)
    const pathname = url.pathname
    const method = req.method

    console.log(`${method} ${pathname}`)

    try {
      // Маршруты API
      if (pathname === '/api/users' && method === 'GET') {
        // Получить всех пользователей
        const users = await getAllUsers(db)
        sendJson(res, 200, { users })

      } else if (pathname === '/api/users' && method === 'POST') {
        // Создать пользователя
        const body = await parseBody(req)
        const { name, email } = body

        if (!name || !email) {
          sendJson(res, 400, { error: 'Имя и email обязательны' })
          return
        }

        try {
          const newUser = await createUser(db, { name, email })
          sendJson(res, 201, newUser)
        } catch (error) {
          if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            sendJson(res, 400, { error: 'Пользователь с таким email уже существует' })
          } else {
            throw error
          }
        }

      } else if (pathname.startsWith('/api/users/') && method === 'GET') {
        // Получить пользователя по ID
        const userId = pathname.split('/')[3]
        const user = await getUserById(db, userId)

        if (user) {
          sendJson(res, 200, user)
        } else {
          sendJson(res, 404, { error: 'Пользователь не найден' })
        }

      } else if (pathname.startsWith('/api/users/') && method === 'PUT') {
        // Обновить пользователя
        const userId = pathname.split('/')[3]
        const body = await parseBody(req)
        const { name, email } = body

        if (!name || !email) {
          sendJson(res, 400, { error: 'Имя и email обязательны' })
          return
        }

        try {
          const updatedUser = await updateUser(db, userId, { name, email })
          
          if (updatedUser) {
            sendJson(res, 200, { ...updatedUser, message: 'Пользователь обновлен' })
          } else {
            sendJson(res, 404, { error: 'Пользователь не найден' })
          }
        } catch (error) {
          if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            sendJson(res, 400, { error: 'Пользователь с таким email уже существует' })
          } else {
            throw error
          }
        }

      } else if (pathname.startsWith('/api/users/') && method === 'DELETE') {
        // Удалить пользователя
        const userId = pathname.split('/')[3]
        const changes = await deleteUser(db, userId)

        if (changes > 0) {
          sendJson(res, 200, { message: 'Пользователь удален', changes })
        } else {
          sendJson(res, 404, { error: 'Пользователь не найден' })
        }

      } else if (pathname === '/api/stats' && method === 'GET') {
        // Статистика
        const userCount = await getUsersCount(db)
        sendJson(res, 200, { users: userCount })

      } else {
        // 404 для неизвестных маршрутов
        sendJson(res, 404, { error: 'Маршрут не найден' })
      }

    } catch (error) {
      console.error('Ошибка сервера:', error)
      sendJson(res, 500, { error: 'Внутренняя ошибка сервера' })
    }
  })

  return { server, db }
}

// Запуск сервера
async function startServer() {
  try {
    const { server, db } = await createServer()
    
    server.listen(PORT, () => {
      console.log(`HTTP сервер запущен на порту ${PORT}`)
      console.log('Используется SQLite база данных')
    })

    // Обработка закрытия приложения
    process.on('SIGINT', () => {
      console.log('Закрытие сервера...')
      server.close(() => {
        db.close((err) => {
          if (err) {
            console.error('Ошибка закрытия базы данных:', err)
          } else {
            console.log('База данных закрыта')
          }
          console.log('Сервер остановлен')
          process.exit(0)
        })
      })
    })

  } catch (error) {
    console.error('Ошибка запуска сервера:', error)
    process.exit(1)
  }
}

// Запуск
startServer() 