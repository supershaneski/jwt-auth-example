import React from 'react'
import './App.css'
import { ApiError, fetchWithCred, fetchWithRefresh } from './lib/api'

function Spinner() {
  return <div className="spinner" />
}

function App() {

  const [isLogin, setIsLogin] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/login`
      const response = await fetchWithCred(url, {
        method: 'POST',
        body: JSON.stringify({
          username: 'alice',
          password: 'secret123'
        })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new ApiError(data.message || 'Login failed', response.status, data)
      }
      const result = await response.json()
      console.log('[Client] Login response:', result)
      setIsLogin(true)
    } catch(err) {
      if (err instanceof ApiError) {
        console.log('[Client] API Error:', err.message)
        console.log('[Client] Status:', err.statusCode)
        console.log('[Client] Details:', err.details)
      } else {
        console.log('[Client] Unexpected error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/logout`
      const response = await fetchWithCred(url, {
        method: 'POST'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new ApiError(data.message || 'Failed to logout', response.status, data)
      }
      const result = await response.json()
      console.log('[Client] Logout response:', result)
      setIsLogin(false)
    } catch(err) {
      if (err instanceof ApiError) {
        console.log('[Client] API Error:', err.message)
        console.log('[Client] Status:', err.statusCode)
        console.log('[Client] Details:', err.details)
      } else {
        console.log('[Client] Unexpected error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleProducts = async () => {
    try {
      setIsLoading(true)
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/products`
      const response = await fetchWithRefresh(url,{},{ retries: 5 })
      if (!response.ok) {
        const data = await response.json()
        throw new ApiError(data.message || 'Failed to get products', response.status, data)
      }
      const result = await response.json()
      console.log('[Client] Get Products response:', result)
    } catch(err) {
      if (err instanceof ApiError) {
        console.log('[Client] API Error:', err.message)
        console.log('[Client] Status:', err.statusCode)
        console.log('[Client] Details:', err.details)
      } else {
        console.log('[Client] Unexpected error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <h4>JWT-Auth Client</h4>
      <p>Open the browser's <strong>DevTools</strong> and check the <strong>Console</strong> and <strong>Network</strong> tabs for authentication and request activity.</p>
      {
        isLogin ? (
          <button onClick={handleLogout} disabled={isLoading}>Logout</button>
        ):(
          <button onClick={handleLogin} disabled={isLoading}>Login</button>
        )
      }
      <button onClick={handleProducts} disabled={isLoading}>{ isLoading && <Spinner /> }Get Products</button>
    </div>
  )
}

export default App
