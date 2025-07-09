const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Создание и подключение к базе данных SQLite
const dbPath = path.join(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message)
  } else {
    console.log('Подключено к SQLite базе данных')
    initDatabase()
  }
})

// Инициализация базы данных
function initDatabase() {
  // Создаем таблицу пользователей
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('Таблицы базы данных инициализированы')
}

// API Routes

// Получить всех пользователей
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json({ users: rows })
  })
})

// Получить пользователя по ID
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params
  
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    if (!row) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }
    
    res.json(row)
  })
})

// Создать нового пользователя
app.post('/api/users', (req, res) => {
  const { name, email } = req.body
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Имя и email обязательны' })
  }

  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Пользователь с таким email уже существует' })
      } else {
        res.status(400).json({ error: err.message })
      }
      return
    }
    res.json({
      id: this.lastID,
      name,
      email
    })
  })
})

// Обновить пользователя
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params
  const { name, email } = req.body
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Имя и email обязательны' })
  }

  db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Пользователь с таким email уже существует' })
      } else {
        res.status(400).json({ error: err.message })
      }
      return
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }
    
    res.json({
      id: parseInt(id),
      name,
      email,
      message: 'Пользователь обновлен'
    })
  })
})

// Удалить пользователя
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params
  
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }
    
    res.json({ 
      message: 'Пользователь удален', 
      changes: this.changes 
    })
  })
})

// Статистика
app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as user_count FROM users', (err, userRow) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    res.json({
      users: userRow.user_count
    })
  })
})

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Express сервер запущен на порту ${PORT}`)
})

// Обработка закрытия приложения
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('Соединение с базой данных закрыто')
    process.exit(0)
  })
}) 