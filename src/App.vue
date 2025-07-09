<template>
  <div id="app">
    <header class="app-header">
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>
      <div class="stats" v-if="stats">
        <span>Пользователей: {{ stats.users }}</span>
      </div>
    </header>
    
    <main class="app-main">
      <div class="tab-content">
        <div class="form-section">
          <h3>{{ editingUser ? 'Редактировать пользователя' : 'Добавить пользователя' }}</h3>
          <form @submit.prevent="editingUser ? updateUser() : addUser()" class="user-form">
            <input 
              v-model="userForm.name" 
              placeholder="Имя" 
              required 
              class="input"
            >
            <input 
              v-model="userForm.email" 
              type="email" 
              placeholder="Email" 
              required 
              class="input"
            >
            <div class="form-buttons">
              <button type="submit" class="btn btn-primary">
                {{ editingUser ? 'Обновить' : 'Добавить' }}
              </button>
              <button 
                v-if="editingUser" 
                type="button" 
                @click="cancelEdit" 
                class="btn btn-secondary"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>

        <div class="list-section">
          <h3>Список пользователей</h3>
          <div v-if="users.length === 0" class="empty-state">
            Пользователей пока нет
          </div>
          <div v-else class="users-list">
            <div v-for="user in users" :key="user.id" class="user-card">
              <div class="user-info">
                <h4>{{ user.name }}</h4>
                <p>{{ user.email }}</p>
                <small>Создан: {{ formatDate(user.created_at) }}</small>
              </div>
              <div class="user-actions">
                <button @click="editUser(user)" class="btn btn-edit btn-small">
                  Редактировать
                </button>
                <button @click="deleteUser(user.id)" class="btn btn-danger btn-small">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        {{ success }}
      </div>
    </main>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import ApiService from './services/api.js'

export default {
  name: 'App',
  setup() {
    const title = ref('Electron + Vue.js + Express + SQLite')
    const subtitle = ref('Управление пользователями')
    const error = ref('')
    const success = ref('')
    const editingUser = ref(null)
    
    const stats = ref(null)
    const users = ref([])
    
    const userForm = reactive({
      name: '',
      email: ''
    })

    // Очистка формы
    function clearForm() {
      userForm.name = ''
      userForm.email = ''
      editingUser.value = null
    }

    // Очистка сообщений
    function clearMessages() {
      error.value = ''
      success.value = ''
    }

    // Показать сообщение об успехе
    function showSuccess(message) {
      success.value = message
      setTimeout(() => {
        success.value = ''
      }, 3000)
    }

    // Загрузка данных
    async function loadData() {
      try {
        const [usersData, statsData] = await Promise.all([
          ApiService.getUsers(),
          ApiService.getStats()
        ])
        
        users.value = usersData.users
        stats.value = statsData
        clearMessages()
      } catch (err) {
        error.value = `Ошибка загрузки данных: ${err.message}`
      }
    }

    // Добавление пользователя
    async function addUser() {
      try {
        clearMessages()
        await ApiService.createUser({
          name: userForm.name,
          email: userForm.email
        })
        
        clearForm()
        showSuccess('Пользователь успешно создан')
        await loadData()
      } catch (err) {
        error.value = `Ошибка создания пользователя: ${err.message}`
      }
    }

    // Начать редактирование пользователя
    function editUser(user) {
      editingUser.value = user
      userForm.name = user.name
      userForm.email = user.email
      clearMessages()
    }

    // Обновление пользователя
    async function updateUser() {
      try {
        clearMessages()
        await ApiService.updateUser(editingUser.value.id, {
          name: userForm.name,
          email: userForm.email
        })
        
        clearForm()
        showSuccess('Пользователь успешно обновлен')
        await loadData()
      } catch (err) {
        error.value = `Ошибка обновления пользователя: ${err.message}`
      }
    }

    // Отмена редактирования
    function cancelEdit() {
      clearForm()
      clearMessages()
    }

    // Удаление пользователя
    async function deleteUser(userId) {
      if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return
      }
      
      try {
        clearMessages()
        await ApiService.deleteUser(userId)
        showSuccess('Пользователь успешно удален')
        await loadData()
      } catch (err) {
        error.value = `Ошибка удаления пользователя: ${err.message}`
      }
    }

    // Форматирование даты
    function formatDate(dateString) {
      return new Date(dateString).toLocaleString('ru-RU')
    }

    // Загружаем данные при монтировании компонента
    onMounted(loadData)

    return {
      title,
      subtitle,
      error,
      success,
      editingUser,
      stats,
      users,
      userForm,
      addUser,
      editUser,
      updateUser,
      cancelEdit,
      deleteUser,
      formatDate
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2c3e50;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
}

.app-header h1 {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
  font-weight: 300;
}

.app-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.stats {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.stats span {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.app-main {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.tab-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.form-section h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.user-form {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: end;
}

.form-buttons {
  display: flex;
  gap: 0.5rem;
}

.input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-width: 200px;
}

.btn {
  background: #42b883;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: #42b883;
}

.btn-primary:hover {
  background: #369870;
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-edit {
  background: #007bff;
}

.btn-edit:hover {
  background: #0056b3;
}

.btn-danger {
  background: #e74c3c;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.list-section h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 2rem;
  font-style: italic;
}

.users-list {
  display: grid;
  gap: 1rem;
}

.user-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info h4 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.error-message {
  background: #e74c3c;
  color: white;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.success-message {
  background: #2ecc71;
  color: white;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .user-form {
    flex-direction: column;
  }
  
  .input {
    min-width: 100%;
  }
  
  .user-card {
    flex-direction: column;
    align-items: start;
    gap: 1rem;
  }
  
  .user-actions {
    width: 100%;
    justify-content: end;
  }
}
</style> 