
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginMode, setLoginMode] = useState<'student' | 'admin'>('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const loggedInUser = await login(email, password)

      if (loggedInUser.role !== loginMode) {
        logout()
        setError(
          loginMode === 'admin'
            ? 'Access denied. This account is not an admin account.'
            : 'This is an admin account. Please select Login as Admin.'
        )
        return
      }

      navigate(loggedInUser.role === 'admin' ? '/admin' : '/', {
        replace: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        className="w-full max-w-md p-8 md:p-10 rounded-3xl border"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <Link to="/" className="text-3xl font-bold">
          borro<span style={{ color: 'var(--accent)' }}>.</span>
        </Link>

        <p className="text-sm mt-8" style={{ color: 'var(--accent)' }}>
          WELCOME BACK
        </p>

        <h1 className="text-3xl font-semibold mt-2">
          Good to see you again.
        </h1>

        <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
          Log in to continue your campus journey.
        </p>

        {/* Login mode */}
        <div className="mt-7">
          <label className="text-sm font-medium">Continue as</label>

          <div
            className="grid grid-cols-2 gap-2 mt-2 p-1 rounded-xl border"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={() => {
                setLoginMode('student')
                setError('')
              }}
              className="py-3 rounded-lg text-sm font-semibold transition"
              style={{
                backgroundColor:
                  loginMode === 'student' ? 'var(--accent)' : 'transparent',
                color:
                  loginMode === 'student' ? 'white' : 'var(--muted)',
              }}
            >
              Student
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('admin')
                setError('')
              }}
              className="py-3 rounded-lg text-sm font-semibold transition"
              style={{
                backgroundColor:
                  loginMode === 'admin' ? 'var(--accent)' : 'transparent',
                color:
                  loginMode === 'admin' ? 'white' : 'var(--muted)',
              }}
            >
              Admin
            </button>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium">Email address</label>

            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@college.edu"
              className="w-full mt-2 px-4 py-3 rounded-xl border outline-none bg-transparent"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>

            <div
              className="flex items-center mt-2 px-4 rounded-xl border"
              style={{ borderColor: 'var(--border)' }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full py-3 outline-none bg-transparent"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#24364b] text-white hover:bg-[#354b64] transition disabled:opacity-60"
          >
            {loading
              ? 'Logging in...'
              : <>
                  Log in <ArrowRight size={17} />
                </>
            }
          </button>
        </form>

        <p
          className="text-center text-sm mt-7"
          style={{ color: 'var(--muted)' }}
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
