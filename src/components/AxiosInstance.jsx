import axios from 'axios'

// Configuration pour Vite.js
const getBaseUrl = () => {
  // Priorité 1 : Variable d'environnement explicite
  const envApiUrl = import.meta.env.VITE_API_URL
  
  if (envApiUrl) {
    return envApiUrl
  }
  
  // Priorité 2 : Détection selon le mode
  if (import.meta.env.PROD) {
    return 'https://sodepsi-backend.onrender.com'
  }
  
  // Développement local
  return 'http://127.0.0.1:8000'
}

const baseUrl = getBaseUrl()

console.log(`🚀 Environnement: ${import.meta.env.MODE}`)
console.log(`🔗 URL API: ${baseUrl}`)
console.log(`📦 Production: ${import.meta.env.PROD}`)

const AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        "accept": "application/json"
    }
})

// Intercepteurs (gardez les mêmes)
AxiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('Token')
        console.log('📤 Making request to:', config.url)
        
        if(token){
            config.headers.Authorization = `Token ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

AxiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response?.status === 401){
            localStorage.removeItem('Token')
            localStorage.removeItem('User')
        }
        return Promise.reject(error)
    }
)

export default AxiosInstance