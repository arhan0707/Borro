
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import Navbar from './components/Navbar'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import LostFound from './pages/LostFound'
import Connect from './pages/Connect'
import Campus from './pages/Campus'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Rentals from './pages/Rentals'
import Admin from './pages/Admin'

import { useAuth } from './context/AuthContext'

function AdminRoute() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Admin />
}

function AppContent() {
  const location = useLocation()

  const hideNavbar =
    location.pathname === '/admin' ||
    location.pathname === '/login' ||
    location.pathname === '/signup'

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/rentals" element={<Rentals />} />
        <Route path="/lost-found" element={<LostFound />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/campus" element={<Campus />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/admin" element={<AdminRoute />} />

        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
