
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { apiRequest } from '../services/api'

type User = {
  user_id: number
  full_name: string
  email: string
  role: 'admin' | 'student'
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  signup: (details: {
    full_name: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('borro_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  async function login(email: string, password: string): Promise<User> {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const loggedInUser = data.user as User

    localStorage.setItem('borro_token', data.token)
    localStorage.setItem('borro_user', JSON.stringify(loggedInUser))
    setUser(loggedInUser)

    return loggedInUser
  }

  async function signup(details: {
    full_name: string
    email: string
    password: string
  }) {
    await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(details),
    })

    await login(details.email, details.password)
  }

  function logout() {
    localStorage.removeItem('borro_token')
    localStorage.removeItem('borro_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
