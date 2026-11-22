
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signup } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signup({
        full_name: fullName,
        email,
        password,
      })

      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
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
          JOIN THE COMMUNITY
        </p>

        <h1 className="text-3xl font-semibold mt-2">
          Create your account.
        </h1>

        <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
          Your campus community starts here.
        </p>

        <div
          className="mt-6 px-4 py-3 rounded-xl border text-sm"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
            color: 'var(--muted)',
          }}
        >
          <span className="font-semibold" style={{ color: 'var(--text)' }}>
            Student registration
          </span>
          <p className="mt-1">
            Create your student account to access Borro.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full mt-2 px-4 py-3 rounded-xl border outline-none bg-transparent"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium">College email</label>
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
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
            {loading ? (
              'Creating account...'
            ) : (
              <>
                Create account <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <p
          className="text-center text-sm mt-7"
          style={{ color: 'var(--muted)' }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
