
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  MapPin,
  CalendarDays,
  Plus,
  PackageSearch,
  X,
  RefreshCw,
} from 'lucide-react'
import { apiRequest } from '../services/api'
import { useAuth } from '../context/AuthContext'

type Report = {
  report_id: number
  user_id: number
  reporter_name?: string
  item_name: string
  report_type: 'lost' | 'found'
  category?: string
  description?: string
  location?: string
  date_lost_found?: string
  image_url?: string
  status: 'open' | 'matched' | 'reunited' | 'resolved'
  created_at: string
}

const initialForm = {
  item_name: '',
  report_type: 'lost',
  category: 'Electronics',
  description: '',
  location: '',
  date_lost_found: '',
  image_url: '',
}

export default function LostFound() {
  const { user } = useAuth()

  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)

  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/lost-found')
      const rows = Array.isArray(data)
        ? data
        : data.reports || data.data || []

      setReports(rows)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load reports'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchesType =
        filter === 'all' ||
        (filter === 'my' && Number(item.user_id) === Number(user?.user_id)) ||
        item.report_type === filter

      const searchText = search.toLowerCase()

      const matchesSearch =
        item.item_name.toLowerCase().includes(searchText) ||
        (item.category || '').toLowerCase().includes(searchText) ||
        (item.location || '').toLowerCase().includes(searchText) ||
        (item.description || '').toLowerCase().includes(searchText)

      return matchesType && matchesSearch
    })
  }, [reports, filter, search, user])

  async function handleCreateReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!user) {
      setError('Please log in to report an item.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      await apiRequest('/lost-found', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          date_lost_found: form.date_lost_found || null,
        }),
      })

      setForm(initialForm)
      setShowForm(false)
      setMessage('Your report has been submitted successfully!')

      await loadReports()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not submit report'
      )
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(
    reportId: number,
    status: Report['status']
  ) {
    try {
      setUpdating(reportId)
      setError('')
      setMessage('')

      await apiRequest(`/lost-found/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      setMessage('Report status updated successfully!')
      setSelectedReport(null)

      await loadReports()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update report'
      )
    } finally {
      setUpdating(null)
    }
  }

  function formatDate(date?: string) {
    if (!date) return 'Not specified'

    const value = date.slice(0, 10)
    return new Date(`${value}T00:00:00`).toLocaleDateString()
  }

  function statusColor(status: Report['status']) {
    switch (status) {
      case 'reunited':
        return 'bg-green-100 text-green-700'
      case 'resolved':
        return 'bg-blue-100 text-blue-700'
      case 'matched':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const filters = [
    { label: 'All Reports', value: 'all' },
    { label: 'Lost', value: 'lost' },
    { label: 'Found', value: 'found' },
    { label: 'My Reports', value: 'my' },
  ]

  return (
    <main
      className="min-h-screen px-6 md:px-16 py-14 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <p
            className="text-sm uppercase tracking-widest font-medium"
            style={{ color: 'var(--accent)' }}
          >
            BORRO COMMUNITY
          </p>

          <h1 className="text-4xl md:text-5xl font-semibold mt-3">
            Lost something?
            <br />
            Let's find it.
          </h1>

          <p className="mt-4" style={{ color: 'var(--muted)' }}>
            Help your campus reunite with lost belongings.
          </p>
        </div>

        <div className="flex gap-3 self-start">
          <button
            onClick={loadReports}
            className="flex items-center gap-2 rounded-full border px-4 py-3"
            style={{ borderColor: 'var(--border)' }}
            title="Refresh reports"
          >
            <RefreshCw size={17} />
          </button>

          <button
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#24364b] text-white hover:bg-[#354b64] transition"
            onClick={() => {
              setError('')
              setMessage('')
              setShowForm(true)
            }}
          >
            <Plus size={18} />
            Report an item
          </button>
        </div>
      </div>

      {message && (
        <div
          className="mt-6 rounded-xl border p-4 text-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-300 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search */}
      <div
        className="flex items-center gap-3 rounded-full px-5 py-4 mt-10 border max-w-2xl"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <Search size={20} style={{ color: 'var(--muted)' }} />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for lost or found items..."
          className="outline-none w-full bg-transparent text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mt-7">
        {filters.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className="px-6 py-2 rounded-full border text-sm transition"
            style={{
              backgroundColor:
                filter === item.value ? 'var(--text)' : 'var(--surface)',
              color:
                filter === item.value ? 'var(--bg)' : 'var(--text)',
              borderColor: 'var(--border)',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Reports */}
      <div className="flex justify-between items-center mt-12 mb-6">
        <h2 className="text-2xl font-semibold">Recent reports</h2>

        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {filteredReports.length} reports
        </span>
      </div>

      {loading ? (
        <p className="py-10">Loading reports...</p>
      ) : filteredReports.length === 0 ? (
        <div
          className="rounded-2xl border py-16 text-center"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--muted)',
          }}
        >
          <PackageSearch size={35} className="mx-auto mb-4" />
          <p>No reports found. Try another search or create a report.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReports.map((item) => (
            <div
              key={item.report_id}
              className="p-6 rounded-2xl border transition hover:shadow-md"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.item_name}
                  className="mb-5 h-48 w-full rounded-xl object-cover"
                />
              ) : (
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <PackageSearch
                    size={28}
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
              )}

              <div className="flex justify-between items-start gap-3">
                <span
                  className="px-4 py-1 rounded-full text-xs font-medium capitalize"
                  style={{
                    backgroundColor:
                      item.report_type === 'lost' ? '#f5e7df' : '#e6eee3',
                    color:
                      item.report_type === 'lost' ? '#9b5944' : '#55734e',
                  }}
                >
                  {item.report_type}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColor(item.status || 'open')}`}
                >
                  {item.status || 'open'}
                </span>
              </div>

              <p className="text-xs mt-5" style={{ color: 'var(--muted)' }}>
                {item.category || 'Other'}
              </p>

              <h3 className="text-lg font-semibold mt-1">
                {item.item_name}
              </h3>

              <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                {item.description || 'No description provided.'}
              </p>

              <div
                className="flex flex-wrap gap-4 mt-5 text-xs"
                style={{ color: 'var(--muted)' }}
              >
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {item.location || 'Location not specified'}
                </span>

                <span className="flex items-center gap-1">
                  <CalendarDays size={14} />
                  {formatDate(item.date_lost_found)}
                </span>
              </div>

              <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                Reported by: {item.reporter_name || 'Student'}
              </p>

              <button
                className="mt-6 text-sm font-medium hover:opacity-70"
                style={{ color: 'var(--accent)' }}
                onClick={() => setSelectedReport(item)}
              >
                View details →
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Create Report Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={handleCreateReport}
            className="my-8 w-full max-w-xl rounded-2xl p-6"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Report an Item</h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
              >
                <X size={21} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Item name"
                value={form.item_name}
                onChange={(e) =>
                  setForm({ ...form, item_name: e.target.value })
                }
                className="rounded-xl border p-3 sm:col-span-2"
              />

              <select
                value={form.report_type}
                onChange={(e) =>
                  setForm({ ...form, report_type: e.target.value })
                }
                className="rounded-xl border p-3"
              >
                <option value="lost">I lost an item</option>
                <option value="found">I found an item</option>
              </select>

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="rounded-xl border p-3"
              >
                <option>Electronics</option>
                <option>Books</option>
                <option>Accessories</option>
                <option>Stationery</option>
                <option>Documents</option>
                <option>Other</option>
              </select>

              <input
                placeholder="Location"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                className="rounded-xl border p-3 sm:col-span-2"
              />

              <label className="text-sm sm:col-span-2">
                Date lost or found
                <input
                  type="date"
                  value={form.date_lost_found}
                  onChange={(e) =>
                    setForm({ ...form, date_lost_found: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>

              <input
                placeholder="Image URL (optional)"
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
                className="rounded-xl border p-3 sm:col-span-2"
              />

              <textarea
                placeholder="Describe the item..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="min-h-24 rounded-xl border p-3 sm:col-span-2"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-xl bg-[#24364b] py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div
            className="my-8 w-full max-w-lg rounded-2xl p-6"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Report Details</h2>

              <button onClick={() => setSelectedReport(null)}>
                <X size={21} />
              </button>
            </div>

            {selectedReport.image_url && (
              <img
                src={selectedReport.image_url}
                alt={selectedReport.item_name}
                className="mb-5 h-48 w-full rounded-xl object-cover"
              />
            )}

            <h3 className="text-2xl font-bold">
              {selectedReport.item_name}
            </h3>

            <p className="mt-2 text-sm capitalize">
              {selectedReport.report_type} · {selectedReport.category || 'Other'}
            </p>

            <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
              {selectedReport.description || 'No description provided.'}
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <p>
                <MapPin size={15} className="mr-2 inline" />
                {selectedReport.location || 'Location not specified'}
              </p>

              <p>
                <CalendarDays size={15} className="mr-2 inline" />
                {formatDate(selectedReport.date_lost_found)}
              </p>

              <p>
                Reported by: {selectedReport.reporter_name || 'Student'}
              </p>

              <p>
                Status: <span className="capitalize">{selectedReport.status || 'open'}</span>
              </p>
            </div>

            {Number(selectedReport.user_id) === Number(user?.user_id) && (
              <div className="mt-6 border-t pt-5"
                style={{ borderColor: 'var(--border)' }}>
                <p className="mb-3 text-sm font-semibold">Update report status</p>

                <div className="grid grid-cols-2 gap-2">
                  {(['open', 'matched', 'reunited', 'resolved'] as const).map(
                    (status) => (
                      <button
                        key={status}
                        disabled={
                          updating === selectedReport.report_id ||
                          selectedReport.status === status
                        }
                        onClick={() =>
                          updateStatus(selectedReport.report_id, status)
                        }
                        className="rounded-xl border px-3 py-2 text-sm capitalize disabled:opacity-40"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {updating === selectedReport.report_id
                          ? 'Updating...'
                          : status}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
