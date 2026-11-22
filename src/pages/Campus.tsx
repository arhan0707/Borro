
import { useEffect, useState } from 'react'
import {
  Search,
  CalendarDays,
  MapPin,
  ArrowUpRight,
  Plus,
  X,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { apiRequest } from '../services/api'
import { useAuth } from '../context/AuthContext'

interface CampusEvent {
  event_id: number
  organizer_id: number
  title: string
  description: string
  category: string
  event_date: string
  venue: string
  registration_url: string
  organizer_name?: string
}

const emptyForm = {
  title: '',
  description: '',
  category: 'Technology',
  event_date: '',
  venue: '',
  registration_url: '',
}

export default function Campus() {
  const { user } = useAuth()

  const [events, setEvents] = useState<CampusEvent[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/events')
      setEvents(data.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title?.toLowerCase().includes(search.toLowerCase()) ||
      event.category?.toLowerCase().includes(search.toLowerCase()) ||
      event.venue?.toLowerCase().includes(search.toLowerCase())

    const matchesTab =
      activeTab === 'all' ||
      Number(event.organizer_id) === Number(user?.user_id)

    return matchesSearch && matchesTab
  })

  const openCreateForm = () => {
    setEditingEvent(null)
    setForm(emptyForm)
    setShowForm(true)
    setMessage('')
    setError('')
  }

  const openEditForm = (event: CampusEvent) => {
    setEditingEvent(event)

    setForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || '',
      event_date: event.event_date
        ? new Date(new Date(event.event_date).getTime() -
            new Date(event.event_date).getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : '',
      venue: event.venue || '',
      registration_url: event.registration_url || '',
    })

    setSelectedEvent(null)
    setShowForm(true)
    setMessage('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError('Please log in to create or edit events.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const payload = {
        ...form,
        event_date: new Date(form.event_date).toISOString(),
      }

      if (editingEvent) {
        await apiRequest(`/events/${editingEvent.event_id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })

        setMessage('Event updated successfully!')
      } else {
        await apiRequest('/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        setMessage('Event created successfully!')
      }

      setShowForm(false)
      setEditingEvent(null)
      setForm(emptyForm)
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (event: CampusEvent) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?`
    )

    if (!confirmed) return

    try {
      setError('')
      setMessage('')

      await apiRequest(`/events/${event.event_id}`, {
        method: 'DELETE',
      })

      setSelectedEvent(null)
      setMessage('Event deleted successfully!')
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  const isOwner = (event: CampusEvent) =>
    Number(event.organizer_id) === Number(user?.user_id)

  return (
    <main
      className="min-h-screen px-6 md:px-16 py-14 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <div className="flex flex-wrap justify-between items-start gap-5">
        <div>
          <p
            className="text-sm uppercase tracking-widest font-medium"
            style={{ color: 'var(--accent)' }}
          >
            BORRO CAMPUS
          </p>

          <h1 className="text-4xl md:text-5xl font-semibold mt-3">
            Campus life,
            <br />
            all in one place.
          </h1>

          <p className="mt-4" style={{ color: 'var(--muted)' }}>
            Discover events, workshops and everything happening around campus.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={18} />
          Create event
        </button>
      </div>

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
          onChange={e => setSearch(e.target.value)}
          placeholder="Search events and activities..."
          className="outline-none w-full bg-transparent text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={() => setActiveTab('all')}
          className="px-5 py-2 rounded-full text-sm border"
          style={{
            backgroundColor: activeTab === 'all' ? 'var(--accent)' : 'var(--surface)',
            color: activeTab === 'all' ? 'white' : 'var(--text)',
            borderColor: 'var(--border)',
          }}
        >
          All events
        </button>

        <button
          onClick={() => setActiveTab('mine')}
          className="px-5 py-2 rounded-full text-sm border"
          style={{
            backgroundColor: activeTab === 'mine' ? 'var(--accent)' : 'var(--surface)',
            color: activeTab === 'mine' ? 'white' : 'var(--text)',
            borderColor: 'var(--border)',
          }}
        >
          My events
        </button>
      </div>

      {/* Feedback */}
      {message && (
        <p className="mt-5 text-sm" style={{ color: 'var(--accent)' }}>
          {message}
        </p>
      )}

      {error && (
        <p className="mt-5 text-sm text-red-500">{error}</p>
      )}

      {/* Events heading */}
      <div className="flex justify-between items-center mt-12 mb-6">
        <h2 className="text-2xl font-semibold">
          {activeTab === 'all' ? 'Upcoming events' : 'Events created by you'}
        </h2>

        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {filteredEvents.length} events
        </span>
      </div>

      {/* Events */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map(event => (
            <div
              key={event.event_id}
              className="p-7 rounded-2xl border hover:shadow-md transition"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  {event.category || 'Campus'}
                </span>

                <CalendarDays size={20} style={{ color: 'var(--muted)' }} />
              </div>

              <h3 className="text-xl font-semibold mt-5">
                {event.title}
              </h3>

              <p
                className="text-sm mt-3 leading-relaxed"
                style={{ color: 'var(--muted)' }}
              >
                {event.description || 'No description available.'}
              </p>

              <div
                className="flex flex-col gap-3 mt-6 text-sm"
                style={{ color: 'var(--muted)' }}
              >
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {formatDate(event.event_date)}
                </span>

                <span className="flex items-center gap-2">
                  <MapPin size={16} />
                  {event.venue || 'Venue not specified'}
                </span>
              </div>

              {event.organizer_name && (
                <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
                  Organized by {event.organizer_name}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-7">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="flex items-center gap-2 text-sm font-medium hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                >
                  View event <ArrowUpRight size={16} />
                </button>

                {isOwner(event) && (
                  <>
                    <button
                      onClick={() => openEditForm(event)}
                      className="flex items-center gap-2 text-sm hover:opacity-70"
                      style={{ color: 'var(--muted)' }}
                    >
                      <Pencil size={15} /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(event)}
                      className="flex items-center gap-2 text-sm text-red-500 hover:opacity-70"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <p className="text-center py-16" style={{ color: 'var(--muted)' }}>
          No events found.
        </p>
      )}

      {/* Create / Edit Event Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-7"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {editingEvent ? 'Edit event' : 'Create an event'}
              </h2>

              <button onClick={() => setShowForm(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                placeholder="Event title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full p-3 rounded-xl border bg-transparent outline-none"
                style={{ borderColor: 'var(--border)' }}
              />

              <textarea
                placeholder="Event description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full p-3 rounded-xl border bg-transparent outline-none resize-none"
                style={{ borderColor: 'var(--border)' }}
                rows={3}
              />

              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full p-3 rounded-xl border bg-transparent outline-none"
                style={{ borderColor: 'var(--border)' }}
              >
                <option value="Technology">Technology</option>
                <option value="Workshop">Workshop</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Academic">Academic</option>
                <option value="Other">Other</option>
              </select>

              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--muted)' }}>
                  Event date and time
                </label>
                <input
                  required
                  type="datetime-local"
                  value={form.event_date}
                  onChange={e => setForm({ ...form, event_date: e.target.value })}
                  className="w-full p-3 rounded-xl border bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              <input
                placeholder="Venue / Location"
                value={form.venue}
                onChange={e => setForm({ ...form, venue: e.target.value })}
                className="w-full p-3 rounded-xl border bg-transparent outline-none"
                style={{ borderColor: 'var(--border)' }}
              />

              <input
                type="url"
                placeholder="Registration URL (optional)"
                value={form.registration_url}
                onChange={e => setForm({ ...form, registration_url: e.target.value })}
                className="w-full p-3 rounded-xl border bg-transparent outline-none"
                style={{ borderColor: 'var(--border)' }}
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {saving ? 'Saving...' : editingEvent ? 'Update event' : 'Publish event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-lg rounded-2xl p-7"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                {selectedEvent.category || 'Campus event'}
              </span>

              <button onClick={() => setSelectedEvent(null)}>
                <X size={22} />
              </button>
            </div>

            <h2 className="text-2xl font-semibold mt-5">
              {selectedEvent.title}
            </h2>

            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {selectedEvent.description || 'No description available.'}
            </p>

            <div className="mt-6 space-y-4 text-sm">
              <p className="flex gap-3 items-center">
                <CalendarDays size={18} />
                {formatDate(selectedEvent.event_date)}
              </p>

              <p className="flex gap-3 items-center">
                <MapPin size={18} />
                {selectedEvent.venue || 'Venue not specified'}
              </p>

              {selectedEvent.organizer_name && (
                <p style={{ color: 'var(--muted)' }}>
                  Organized by {selectedEvent.organizer_name}
                </p>
              )}
            </div>

            {selectedEvent.registration_url && (
              <a
                href={selectedEvent.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-7 py-3 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                Register for event <ExternalLink size={16} />
              </a>
            )}

            {isOwner(selectedEvent) && (
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => openEditForm(selectedEvent)}
                  className="flex-1 py-3 rounded-xl border text-sm"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Edit event
                </button>

                <button
                  onClick={() => handleDelete(selectedEvent)}
                  className="flex-1 py-3 rounded-xl text-sm text-white bg-red-500"
                >
                  Delete event
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
