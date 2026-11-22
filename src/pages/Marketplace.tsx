
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, X } from 'lucide-react'
import { apiRequest } from '../services/api'
import { useAuth } from '../context/AuthContext'

type Listing = {
  listing_id: number
  owner_id: number
  owner_name?: string
  item_name: string
  description: string
  category: string
  listing_type: 'rent' | 'sell' | 'swap' | 'giveaway'
  condition?: string
  price: number
  security_deposit?: number
  pickup_location?: string
  image_url?: string
  is_available: boolean
}

const initialForm = {
  item_name: '',
  description: '',
  category: 'Electronics',
  listing_type: 'rent',
  condition: 'Good',
  price: '',
  security_deposit: '0',
  pickup_location: '',
  image_url: '',
}

export default function Marketplace() {
  const { user } = useAuth()

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')

  const categories = [
    'All',
    'Electronics',
    'Books',
    'Stationery',
    'Lab Equipment',
    'Sports',
    'Other',
  ]

  async function loadListings() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/listings')
      const rows = Array.isArray(data)
        ? data
        : data.listings || data.data || []

      setListings(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadListings()
  }, [])

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        category === 'All' || item.category === category

      return item.is_available && matchesSearch && matchesCategory
    })
  }, [listings, search, category])

  async function handleCreateListing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!user) {
      setError('Please log in to create a listing.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const payload = {
        ...form,
        price: Number(form.price) || 0,
        security_deposit: Number(form.security_deposit) || 0,
      }

      await apiRequest('/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setForm(initialForm)
      setShowForm(false)
      setMessage('Your listing has been created successfully!')
      await loadListings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create listing')
    } finally {
      setSaving(false)
    }
  }

  async function handleRentalRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!user || !selectedListing) {
      setMessage('Please log in before requesting a rental.')
      return
    }

    if (Number(selectedListing.owner_id) === Number(user.user_id)) {
      setMessage("You can't request your own item.")
      return
    }

    if (!startDate || !endDate) {
      setMessage('Please select both rental dates.')
      return
    }

    if (endDate < startDate) {
      setMessage('End date cannot be before start date.')
      return
    }

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1

    try {
      setRequesting(true)
      setMessage('')

      await apiRequest('/rentals', {
        method: 'POST',
        body: JSON.stringify({
          listing_id: selectedListing.listing_id,
          start_date: startDate,
          end_date: endDate,
          total_amount: days * Number(selectedListing.price || 0),
        }),
      })

      setMessage('Rental request sent successfully!')
      setSelectedListing(null)
      setStartDate('')
      setEndDate('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Rental request failed')
    } finally {
      setRequesting(false)
    }
  }

  const today = new Date()
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  return (
    <main className="min-h-screen px-5 py-10 md:px-10"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Borro Marketplace</h1>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>
              Find, rent, sell, swap or share items with fellow students.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/rentals"
              className="rounded-xl border px-5 py-3 text-sm font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              My Rental Requests
            </Link>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <Plus size={18} /> Create Listing
            </button>
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

        <div className="mb-7 flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-xl border px-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <Search size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full bg-transparent py-3 outline-none"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border px-4 py-3"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              borderColor: 'var(--border)',
            }}
          >
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading marketplace...</p>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center"
            style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-xl font-semibold">No listings found</h2>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>
              Try another search or create a new listing.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((item) => (
              <article
                key={item.listing_id}
                className="overflow-hidden rounded-2xl border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center text-5xl"
                    style={{ background: 'var(--surface-secondary)' }}>
                    📦
                  </div>
                )}

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full px-3 py-1 text-xs"
                      style={{ background: 'var(--surface-secondary)' }}>
                      {item.category}
                    </span>
                    <span className="text-xs capitalize"
                      style={{ color: 'var(--muted)' }}>
                      {item.listing_type}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold">{item.item_name}</h2>

                  <p className="mt-2 line-clamp-2 text-sm"
                    style={{ color: 'var(--muted)' }}>
                    {item.description}
                  </p>

                  <div className="mt-4 space-y-1 text-sm"
                    style={{ color: 'var(--muted)' }}>
                    <p>Condition: {item.condition || 'Not specified'}</p>
                    <p>Location: {item.pickup_location || 'Not specified'}</p>
                    <p>Owner: {item.owner_name || 'Student'}</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold">
                        ₹{Number(item.price || 0).toLocaleString('en-IN')}
                      </p>
                      {item.listing_type === 'rent' && (
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          Per day
                        </p>
                      )}
                    </div>

                    {item.listing_type === 'rent' &&
                      Number(item.owner_id) !== Number(user?.user_id) && (
                        <button
                          onClick={() => {
                            setSelectedListing(item)
                            setMessage('')
                          }}
                          className="rounded-xl px-4 py-2 text-sm font-semibold"
                          style={{ background: 'var(--accent)', color: 'white' }}
                        >
                          Request to Rent
                        </button>
                      )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={handleCreateListing}
            className="my-8 w-full max-w-xl rounded-2xl p-6"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create a Listing</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Item name"
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                className="rounded-xl border p-3"
              />

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border p-3"
              >
                {categories.filter((c) => c !== 'All').map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <select
                value={form.listing_type}
                onChange={(e) => setForm({ ...form, listing_type: e.target.value })}
                className="rounded-xl border p-3"
              >
                <option value="rent">Rent</option>
                <option value="sell">Sell</option>
                <option value="swap">Swap</option>
                <option value="giveaway">Giveaway</option>
              </select>

              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="rounded-xl border p-3"
              >
                <option>New</option>
                <option>Like New</option>
                <option>Good</option>
                <option>Fair</option>
              </select>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price (₹)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="rounded-xl border p-3"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Security deposit (₹)"
                value={form.security_deposit}
                onChange={(e) => setForm({ ...form, security_deposit: e.target.value })}
                className="rounded-xl border p-3"
              />

              <input
                placeholder="Pickup location"
                value={form.pickup_location}
                onChange={(e) => setForm({ ...form, pickup_location: e.target.value })}
                className="rounded-xl border p-3 sm:col-span-2"
              />

              <input
                placeholder="Image URL (optional)"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="rounded-xl border p-3 sm:col-span-2"
              />

              <textarea
                required
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-24 rounded-xl border p-3 sm:col-span-2"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {saving ? 'Creating...' : 'Publish Listing'}
            </button>
          </form>
        </div>
      )}

      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleRentalRequest}
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Request Rental</h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                  {selectedListing.item_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListing(null)}
              >
                <X />
              </button>
            </div>

            <label className="mb-2 block text-sm">Start date</label>
            <input
              required
              type="date"
              min={todayString}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mb-4 w-full rounded-xl border p-3"
            />

            <label className="mb-2 block text-sm">End date</label>
            <input
              required
              type="date"
              min={startDate || todayString}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mb-4 w-full rounded-xl border p-3"
            />

            <div className="mb-5 rounded-xl p-4"
              style={{ background: 'var(--surface-secondary)' }}>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Rental price per day
              </p>
              <p className="text-xl font-bold">
                ₹{Number(selectedListing.price || 0).toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Final amount is calculated from the selected dates.
              </p>
            </div>

            <button
              type="submit"
              disabled={requesting}
              className="w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {requesting ? 'Sending Request...' : 'Send Rental Request'}
            </button>
          </form>
        </div>
      )}
    </main>
  )
}
