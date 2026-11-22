
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, CalendarDays } from 'lucide-react'
import { apiRequest } from '../services/api'
import { useAuth } from '../context/AuthContext'

type Rental = {
  request_id: number
  listing_id: number
  requester_id: number
  owner_id: number
  item_name: string
  requester_name?: string
  start_date: string
  end_date: string
  total_amount: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
  request_date: string
}

export default function Rentals() {
  const { user } = useAuth()

  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')

  const loadRentals = useCallback(async () => {
    if (!user) {
      setRentals([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/rentals')

      const rows: Rental[] = Array.isArray(data)
        ? data
        : data.rentals || data.requests || data.data || []

      setRentals(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load rentals')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadRentals()
  }, [loadRentals])

  const myRequests = rentals.filter(
    (rental) => Number(rental.requester_id) === Number(user?.user_id)
  )

  const requestsForMyItems = rentals.filter(
    (rental) => Number(rental.owner_id) === Number(user?.user_id)
  )

  async function updateStatus(requestId: number, status: 'approved' | 'rejected') {
    try {
      setUpdating(requestId)
      setError('')
      setMessage('')

      await apiRequest(`/rentals/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      setMessage(`Rental request ${status}.`)
      await loadRentals()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update request')
    } finally {
      setUpdating(null)
    }
  }

  async function completeRental(requestId: number) {
    try {
      setUpdating(requestId)
      setError('')
      setMessage('')

      await apiRequest(`/rentals/${requestId}/complete`, {
        method: 'PATCH',
      })

      setMessage('Rental marked as completed.')
      await loadRentals()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete rental')
    } finally {
      setUpdating(null)
    }
  }

  function formatDate(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString()
  }

  function statusStyle(status: Rental['status']) {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'cancelled':
        return 'bg-gray-200 text-gray-700'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const displayedRentals =
    activeTab === 'received' ? requestsForMyItems : myRequests

  if (!user) {
    return (
      <main className="min-h-screen p-10 text-center"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <h1 className="text-2xl font-bold">Please log in</h1>
        <p className="mt-2">Log in to view your rental requests.</p>
        <Link to="/login"
          className="mt-5 inline-block rounded-xl px-6 py-3 text-white"
          style={{ background: 'var(--accent)' }}>
          Log In
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-5 py-10 md:px-10"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      <div className="mx-auto max-w-5xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Rentals</h1>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>
              Manage the rental requests you send and receive.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadRentals}
              className="flex items-center gap-2 rounded-xl border px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <RefreshCw size={17} /> Refresh
            </button>

            <Link
              to="/marketplace"
              className="rounded-xl px-5 py-3 font-semibold text-white"
              style={{ background: 'var(--accent)' }}
            >
              Marketplace
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border p-4 text-sm"
            style={{ borderColor: 'var(--border)' }}>
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-300 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-7 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border p-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Requests received
            </p>
            <p className="mt-2 text-3xl font-bold">
              {requestsForMyItems.length}
            </p>
          </div>

          <div className="rounded-2xl border p-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Requests sent
            </p>
            <p className="mt-2 text-3xl font-bold">
              {myRequests.length}
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-3 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('received')}
            className="border-b-2 px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: activeTab === 'received' ? 'var(--accent)' : 'transparent',
            }}
          >
            Received ({requestsForMyItems.length})
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className="border-b-2 px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: activeTab === 'sent' ? 'var(--accent)' : 'transparent',
            }}
          >
            Sent ({myRequests.length})
          </button>
        </div>

        {loading ? (
          <p>Loading rental requests...</p>
        ) : displayedRentals.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <CalendarDays size={35} className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold">No rental requests yet</h2>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>
              {activeTab === 'received'
                ? 'Requests from other students for your items will appear here.'
                : 'The requests you send from Marketplace will appear here.'}
            </p>
            <Link
              to="/marketplace"
              className="mt-5 inline-block rounded-xl px-5 py-3 text-white"
              style={{ background: 'var(--accent)' }}
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedRentals.map((rental) => (
              <article
                key={rental.request_id}
                className="rounded-2xl border p-5"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">{rental.item_name}</h2>

                    <p className="mt-1 text-sm"
                      style={{ color: 'var(--muted)' }}>
                      Request #{rental.request_id}
                    </p>

                    {activeTab === 'received' && (
                      <p className="mt-2 text-sm">
                        Requested by: {rental.requester_name || `Student #${rental.requester_id}`}
                      </p>
                    )}

                    {activeTab === 'sent' && (
                      <p className="mt-2 text-sm">
                        Owner's listing
                      </p>
                    )}
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(rental.status)}`}>
                    {rental.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <p style={{ color: 'var(--muted)' }}>Start date</p>
                    <p className="mt-1 font-medium">{formatDate(rental.start_date)}</p>
                  </div>

                  <div>
                    <p style={{ color: 'var(--muted)' }}>End date</p>
                    <p className="mt-1 font-medium">{formatDate(rental.end_date)}</p>
                  </div>

                  <div>
                    <p style={{ color: 'var(--muted)' }}>Total amount</p>
                    <p className="mt-1 font-semibold">
                      ₹{Number(rental.total_amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {activeTab === 'received' && rental.status === 'pending' && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      disabled={updating === rental.request_id}
                      onClick={() => updateStatus(rental.request_id, 'approved')}
                      className="rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: 'var(--accent)' }}
                    >
                      {updating === rental.request_id ? 'Updating...' : 'Approve'}
                    </button>

                    <button
                      disabled={updating === rental.request_id}
                      onClick={() => updateStatus(rental.request_id, 'rejected')}
                      className="rounded-xl border px-5 py-2 text-sm font-semibold disabled:opacity-50"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {activeTab === 'received' && rental.status === 'approved' && (
                  <button
                    disabled={updating === rental.request_id}
                    onClick={() => completeRental(rental.request_id)}
                    className="mt-5 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}
                  >
                    {updating === rental.request_id
                      ? 'Updating...'
                      : 'Mark as Completed'}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
