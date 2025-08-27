import axios from 'axios'

const API_BASE_URL = '/api'

// Axios Instance mit Interceptor für Token
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor für Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor für Fehlerbehandlung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

// Auth API
export const loginUser = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password })
  return response.data
}

export const registerUser = async (userData: {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

export const verifyToken = async (token: string) => {
  const response = await api.get('/auth/verify', {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data.user
}

// Services API
export const getServices = async (params?: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  search?: string
}) => {
  const response = await api.get('/services', { params })
  return response.data
}

export const getService = async (id: number) => {
  const response = await api.get(`/services/${id}`)
  return response.data
}

export const createService = async (serviceData: {
  title: string
  description?: string
  status?: string
  priority?: string
  number?: number
}) => {
  const response = await api.post('/services', serviceData)
  return response.data
}

export const updateService = async (id: number, serviceData: {
  title?: string
  description?: string
  status?: string
  priority?: string
  number?: number
}) => {
  const response = await api.put(`/services/${id}`, serviceData)
  return response.data
}

export const deleteService = async (id: number) => {
  const response = await api.delete(`/services/${id}`)
  return response.data
}

export const updateServiceStatus = async (id: number, status: string) => {
  const response = await api.patch(`/services/${id}/status`, { status })
  return response.data
}

// Users API
export const getUsers = async (params?: {
  page?: number
  limit?: number
  search?: string
}) => {
  const response = await api.get('/users', { params })
  return response.data
}

export const getUser = async (id: number) => {
  const response = await api.get(`/users/${id}`)
  return response.data
}

export const updateUser = async (id: number, userData: {
  firstName?: string
  lastName?: string
  email?: string
  isActive?: boolean
}) => {
  const response = await api.put(`/users/${id}`, userData)
  return response.data
}

export const getGroups = async () => {
  const response = await api.get('/users/groups/all')
  return response.data
}

export const getStaffUsers = async () => {
  const response = await api.get('/users/staff')
  return response.data
}

export const addUserToGroup = async (userId: number, groupId: number, role?: string) => {
  const response = await api.post(`/users/${userId}/groups`, { groupId, role })
  return response.data
}

export const removeUserFromGroup = async (userId: number, groupId: number) => {
  const response = await api.delete(`/users/${userId}/groups/${groupId}`)
  return response.data
}

// Inmate API
export const createInmate = async (inmateData: {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}) => {
  const response = await api.post('/users/inmates', inmateData)
  return response.data
}

// Staff API
export const createStaff = async (staffData: {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  confirmPassword: string
  selectedGroup: string
}) => {
  const response = await api.post('/users/staff', staffData)
  return response.data
}

// Admin API
export const createAdmin = async (adminData: {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}) => {
  const response = await api.post('/users/admins', adminData)
  return response.data
}

export default api
