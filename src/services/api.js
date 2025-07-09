const API_BASE_URL = 'http://localhost:3001/api'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сети')
      }
      
      return data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // Методы для работы с пользователями
  async getUsers() {
    return this.request('/users')
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`)
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    })
  }

  // Получение статистики
  async getStats() {
    return this.request('/stats')
  }
}

export default new ApiService() 