
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Moon, Sun, User, LogOut, ChevronDown,
  Bell, CheckCheck, Trash2, X, Menu
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'

interface Notification {
  notification_id: number
  user_id: number
  message: string
  notification_type: string
  related_id: number | null
  is_read: boolean
  created_at: string
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter(n => !n.is_read).length

  const loadNotifications = async () => {
    if (!user) return

    try {
      const data = await apiRequest('/notifications')
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadNotifications()
    } else {
      setNotifications([])
    }
  }, [user?.user_id])

  function handleLogout() {
    logout()
    setProfileOpen(false)
    setNotificationsOpen(false)
    setMobileMenuOpen(false)
    navigate('/')
  }

  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/notifications/${id}/read`, {
        method: 'PATCH'
      })

      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === id ? { ...n, is_read: true } : n
        )
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', {
        method: 'PATCH'
      })

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      await apiRequest(`/notifications/${id}`, {
        method: 'DELETE'
      })

      setNotifications(prev =>
        prev.filter(n => n.notification_id !== id)
      )
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const initials = user?.full_name
    ?.split(' ')
    .map(name => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' || !n.is_read
  )

  const navigationLinks = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Lost & Found', path: '/lost-found' },
    { name: 'Connect', path: '/connect' },
    { name: 'Campus', path: '/campus' }
  ]

  return (
    <nav
      className="relative z-50 flex items-center justify-between px-4 sm:px-6 md:px-16 py-4 sm:py-5 border-b transition-colors duration-300"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        onClick={() => setMobileMenuOpen(false)}
        className="text-3xl font-bold tracking-tight shrink-0"
        style={{ color: 'var(--text)' }}
      >
        borro<span style={{ color: 'var(--accent)' }}>.</span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center gap-8 text-sm">
        {navigationLinks.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className="hover:opacity-70 transition"
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* Mobile Menu Button */}
        <button
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen)
            setProfileOpen(false)
            setNotificationsOpen(false)
          }}
          className="md:hidden p-2 rounded-full border hover:opacity-70 transition"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border hover:opacity-70 transition"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>

        {/* Logged Out */}
        {!user ? (
          <>
            <Link
              to="/login"
              className="hidden sm:block text-sm hover:opacity-70"
            >
              Log in
            </Link>

            <Link
              to="/signup"
              className="bg-[#24364b] text-white px-4 sm:px-5 py-2.5 rounded-full text-sm hover:bg-[#354b64] transition"
            >
              Get Started
            </Link>
          </>
        ) : (
          <>
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  const opening = !notificationsOpen
                  setNotificationsOpen(opening)
                  setProfileOpen(false)
                  setMobileMenuOpen(false)

                  if (opening) loadNotifications()
                }}
                className="relative p-2 rounded-full border hover:opacity-70"
                style={{ borderColor: 'var(--border)' }}
                aria-label="Notifications"
              >
                <Bell size={20} />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 top-full mt-3 w-72 sm:w-96 max-w-[calc(100vw-2rem)] rounded-xl border shadow-xl overflow-hidden"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div
                    className="flex justify-between items-center p-4 border-b"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div>
                      <h3 className="font-semibold">Notifications</h3>
                      <p
                        className="text-xs mt-1"
                        style={{ color: 'var(--muted)' }}
                      >
                        {unreadCount} unread
                      </p>
                    </div>

                    <button
                      onClick={() => setNotificationsOpen(false)}
                      aria-label="Close notifications"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Filters */}
                  <div
                    className="flex justify-between items-center px-4 py-3 border-b"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilter('all')}
                        className="text-xs px-3 py-1.5 rounded-full"
                        style={{
                          background: filter === 'all' ? 'var(--accent)' : 'var(--bg)',
                          color: filter === 'all' ? 'white' : 'var(--text)',
                        }}
                      >
                        All
                      </button>

                      <button
                        onClick={() => setFilter('unread')}
                        className="text-xs px-3 py-1.5 rounded-full"
                        style={{
                          background: filter === 'unread' ? 'var(--accent)' : 'var(--bg)',
                          color: filter === 'unread' ? 'white' : 'var(--text)',
                        }}
                      >
                        Unread
                      </button>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs flex items-center gap-1"
                        style={{ color: 'var(--accent)' }}
                      >
                        <CheckCheck size={14} />
                        Read all
                      </button>
                    )}
                  </div>

                  {/* Notifications */}
                  <div className="max-h-96 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell
                          size={28}
                          className="mx-auto mb-3"
                          style={{ color: 'var(--muted)' }}
                        />

                        <p className="text-sm font-medium">
                          No notifications
                        </p>

                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--muted)' }}
                        >
                          You're all caught up!
                        </p>
                      </div>
                    ) : (
                      filteredNotifications.map(notification => (
                        <div
                          key={notification.notification_id}
                          onClick={() => markAsRead(notification.notification_id)}
                          className="flex gap-3 p-4 border-b cursor-pointer hover:opacity-80"
                          style={{
                            borderColor: 'var(--border)',
                            background: notification.is_read ? 'transparent' : 'var(--bg)',
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-medium mb-1"
                              style={{ color: 'var(--accent)' }}
                            >
                              {notification.notification_type.replace(/_/g, ' ')}
                            </p>

                            <p className="text-sm leading-relaxed">
                              {notification.message}
                            </p>

                            <p
                              className="text-[10px] mt-2"
                              style={{ color: 'var(--muted)' }}
                            >
                              {new Date(notification.created_at).toLocaleString('en-IN')}
                            </p>
                          </div>

                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                          )}

                          <button
                            onClick={e => {
                              e.stopPropagation()
                              deleteNotification(notification.notification_id)
                            }}
                            className="self-start p-1 hover:text-red-500"
                            title="Delete notification"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen)
                  setNotificationsOpen(false)
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-2 rounded-full border px-2 sm:px-3 py-2 hover:opacity-80 transition"
                style={{ borderColor: 'var(--border)' }}
                aria-label="Profile menu"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {initials || <User size={17} />}
                </div>

                <span className="hidden sm:block max-w-28 truncate text-sm font-medium">
                  {user.full_name}
                </span>

                <ChevronDown size={16} />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-3 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border shadow-xl"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div
                    className="border-b p-4"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <p className="font-semibold">{user.full_name}</p>

                    <p
                      className="mt-1 truncate text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      {user.email}
                    </p>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/rentals"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:opacity-70"
                    >
                      <User size={17} />
                      My Rentals
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          className="absolute top-full left-0 w-full md:hidden border-b shadow-lg p-4 flex flex-col gap-1"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)'
          }}
        >
          {navigationLinks.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-sm hover:opacity-70 transition"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
