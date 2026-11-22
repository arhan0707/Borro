
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Search,
  FolderKanban,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Trash2,
} from 'lucide-react'

import { apiRequest } from '../services/api'
import { useAuth } from '../context/AuthContext'

type Stats = {
  total_users: string
  active_listings: string
  total_reports: string
  total_projects: string
  total_events: string
  total_rental_requests: string
}

type AdminUser = {
  user_id: number
  full_name: string
  email: string
  college_id: string | null
  department: string | null
  role: string
  created_at: string | null
}

type AdminListing = {
  listing_id: number
  owner_id: number
  owner_name: string
  item_name: string
  description: string
  category: string
  listing_type: string
  condition: string
  price: number | string | null
  pickup_location: string
  is_available: boolean
  created_at: string
  image_url?: string | null
}

type AdminReport = {
  report_id: number
  user_id: number
  reporter_name: string
  item_name: string
  report_type: 'lost' | 'found'
  category: string
  description: string
  location: string
  date_lost_found: string
  status: 'open' | 'matched' | 'reunited' | 'resolved'
  created_at: string
}

type AdminProject = {
  project_id: number
  title: string
  description: string
  category: string
  required_skills: string[] | string | null
  team_size: number | null
  status: string
  owner_name: string
  created_at: string
}

type AdminEvent = {
  event_id: number
  title: string
  description: string
  category: string
  event_date: string
  venue: string
  organizer_name: string
}

type Section =
  | 'Overview'
  | 'Users'
  | 'Marketplace'
  | 'Lost & Found'
  | 'Projects'
  | 'Campus Events'

function Admin() {
  const { user, logout } = useAuth()

  const [activeSection, setActiveSection] = useState<Section>('Overview')

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [listings, setListings] = useState<AdminListing[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [events, setEvents] = useState<AdminEvent[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [listingFilter, setListingFilter] = useState('all')
  const [reportFilter, setReportFilter] = useState('all')

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Overview' as Section, icon: LayoutDashboard },
    { name: 'Users' as Section, icon: Users },
    { name: 'Marketplace' as Section, icon: ShoppingBag },
    { name: 'Lost & Found' as Section, icon: Search },
    { name: 'Projects' as Section, icon: FolderKanban },
    { name: 'Campus Events' as Section, icon: CalendarDays },
  ]

  // FETCH OVERVIEW STATISTICS
  async function fetchStats() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/admin/stats')
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  // FETCH USERS
  async function fetchUsers() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/admin/users')
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // FETCH MARKETPLACE LISTINGS
  async function fetchListings() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/admin/listings')
      setListings(data.listings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  // FETCH LOST AND FOUND REPORTS
  async function fetchReports() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/admin/reports')
      setReports(data.reports || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  // FETCH PROJECTS
  async function fetchProjects() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/admin/projects')
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  // FETCH CAMPUS EVENTS
  async function fetchEvents() {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/admin/events')
      setEvents(data.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  // REMOVE MARKETPLACE LISTING
  async function removeListing(id: number, itemName: string) {
    const confirmed = window.confirm(
      `Remove "${itemName}" from the marketplace?`
    )

    if (!confirmed) return

    try {
      setLoading(true)
      setError('')

      await apiRequest(`/admin/listings/${id}`, {
        method: 'DELETE',
      })

      await fetchListings()
      await fetchStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove listing')
    } finally {
      setLoading(false)
    }
  }

  // UPDATE LOST AND FOUND STATUS
  async function updateReportStatus(
    id: number,
    status: AdminReport['status']
  ) {
    try {
      setLoading(true)
      setError('')

      await apiRequest(`/admin/reports/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      await fetchReports()
      await fetchStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report')
    } finally {
      setLoading(false)
    }
  }

  // LOAD DATA WHEN SECTION CHANGES
  useEffect(() => {
    if (activeSection === 'Overview') fetchStats()
    if (activeSection === 'Users') fetchUsers()
    if (activeSection === 'Marketplace') fetchListings()
    if (activeSection === 'Lost & Found') fetchReports()
    if (activeSection === 'Projects') fetchProjects()
    if (activeSection === 'Campus Events') fetchEvents()
  }, [activeSection])

  // OVERVIEW CARDS
  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users,
      icon: Users,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      title: 'Active Listings',
      value: stats?.active_listings,
      icon: ShoppingBag,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Lost & Found Reports',
      value: stats?.total_reports,
      icon: Search,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Total Projects',
      value: stats?.total_projects,
      icon: FolderKanban,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Campus Events',
      value: stats?.total_events,
      icon: CalendarDays,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
    {
      title: 'Rental Requests',
      value: stats?.total_rental_requests,
      icon: ClipboardList,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
  ]

  // FILTER USERS
  const filteredUsers = users.filter((item) => {
    const searchMatch =
      item.full_name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      String(item.user_id).includes(search)

    const roleMatch =
      roleFilter === 'all' || item.role === roleFilter

    return searchMatch && roleMatch
  })

  // FILTER LISTINGS
  const filteredListings = listings.filter((item) => {
    const searchMatch =
      item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      (item.owner_name || '').toLowerCase().includes(search.toLowerCase())

    const statusMatch =
      listingFilter === 'all' ||
      (listingFilter === 'available' && item.is_available) ||
      (listingFilter === 'removed' && !item.is_available)

    return searchMatch && statusMatch
  })

  // FILTER REPORTS
  const filteredReports = reports.filter((item) => {
    const searchMatch =
      item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      (item.reporter_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(search.toLowerCase())

    const statusMatch =
      reportFilter === 'all' ||
      item.report_type === reportFilter ||
      item.status === reportFilter

    return searchMatch && statusMatch
  })

  function changeSection(section: Section) {
    setActiveSection(section)
    setSidebarOpen(false)
    setSearch('')
    setRoleFilter('all')
    setListingFilter('all')
    setReportFilter('all')
    setError('')
  }

  function refreshCurrentSection() {
    if (activeSection === 'Users') fetchUsers()
    else if (activeSection === 'Marketplace') fetchListings()
    else if (activeSection === 'Lost & Found') fetchReports()
    else if (activeSection === 'Projects') fetchProjects()
    else if (activeSection === 'Campus Events') fetchEvents()
    else fetchStats()
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0B0D14] text-white flex">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 overflow-y-auto bg-[#11141E] border-r border-white/[0.07] p-5 flex flex-col transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h1 className="font-bold text-xl tracking-wide">BORRO</h1>
              <p className="text-[10px] text-gray-500 tracking-[3px]">
                ADMIN PANEL
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400"
            aria-label="Close sidebar"
          >
            <X />
          </button>
        </div>

        <p className="text-[10px] font-semibold tracking-[2px] text-gray-500 mb-4">
          MAIN MENU
        </p>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = activeSection === item.name

            return (
              <button
                key={item.name}
                onClick={() => changeSection(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                    : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.name}

                {active && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </button>
            )
          })}
        </nav>

        {/* ADMIN PROFILE */}
        <div className="mt-auto border-t border-white/[0.07] pt-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0">

        {/* TOPBAR */}
        <header className="min-w-0 h-[76px] border-b border-white/[0.07] bg-[#11141E]/80 backdrop-blur-md px-4 sm:px-5 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400"
              aria-label="Open sidebar"
            >
              <Menu />
            </button>

            <div className="min-w-0">
              <h2 className="font-semibold text-lg truncate">{activeSection}</h2>
              <p className="text-xs text-gray-500">
                Borro Administration
              </p>
            </div>
          </div>

          <button
            onClick={refreshCurrentSection}
            disabled={loading}
            className="flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <div className="w-full min-w-0 p-4 sm:p-5 md:p-8 max-w-7xl mx-auto">

          {/* ERROR MESSAGE */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <p>{error}</p>

              <button
                onClick={refreshCurrentSection}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition disabled:opacity-50"
              >
                Try Again
              </button>
            </div>
          )}

          {/* OVERVIEW */}
          {activeSection === 'Overview' && (
            <>
              <div className="mb-8">
                <p className="text-violet-400 text-xs font-semibold tracking-[2px] mb-2">
                  BORRO CONTROL CENTER
                </p>

                <h1 className="text-2xl md:text-3xl font-bold">
                  Platform Overview
                </h1>

                <p className="text-gray-500 text-sm mt-2">
                  Monitor your campus community from one place.
                </p>
              </div>

              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                  <h3 className="font-semibold text-lg">
                    Platform Statistics
                  </h3>

                  <span className="text-xs text-gray-500">
                    Live database data
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {statCards.map((card) => {
                    const Icon = card.icon

                    return (
                      <div
                        key={card.title}
                        className="bg-[#141824] border border-white/[0.07] rounded-2xl p-5 hover:border-violet-500/30 transition"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <p className="text-sm text-gray-400">
                            {card.title}
                          </p>

                          <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                            <Icon size={20} className={card.color} />
                          </div>
                        </div>

                        <p className="text-3xl font-bold">
                          {loading ? '...' : card.value ?? '0'}
                        </p>

                        <p className="text-xs text-gray-500 mt-2">
                          Current database count
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-[#141824] border border-white/[0.07] rounded-2xl p-5 sm:p-6">
                <h3 className="font-semibold mb-2">Administration</h3>

                <p className="text-sm text-gray-500 mb-5">
                  You are currently logged in with administrator access.
                </p>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/10">
                  <ShieldCheck className="text-emerald-400 shrink-0" size={22} />

                  <div>
                    <p className="text-sm font-medium text-emerald-400">
                      Admin access verified
                    </p>

                    <p className="text-xs text-gray-500">
                      Your account has administrator privileges.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* USERS */}
          {activeSection === 'Users' && (
            <>
              <div className="mb-8">
                <p className="text-violet-400 text-xs font-semibold tracking-[2px] mb-2">
                  USER MANAGEMENT
                </p>

                <h1 className="text-2xl md:text-3xl font-bold">
                  Registered Users
                </h1>

                <p className="text-gray-500 text-sm mt-2">
                  View and monitor student accounts on Borro.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#141824] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-gray-500 text-sm">Total Accounts</p>
                  <p className="text-2xl font-bold mt-2">{users.length}</p>
                </div>

                <div className="bg-[#141824] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-gray-500 text-sm">Students</p>
                  <p className="text-2xl font-bold mt-2">
                    {users.filter((u) => u.role === 'student').length}
                  </p>
                </div>

                <div className="bg-[#141824] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-gray-500 text-sm">Administrators</p>
                  <p className="text-2xl font-bold mt-2 text-violet-400">
                    {users.filter((u) => u.role === 'admin').length}
                  </p>
                </div>
              </div>

              <div className="bg-[#141824] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/[0.07] flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold">All Users</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {filteredUsers.length} accounts found
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />

                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full sm:w-56 bg-[#0B0D14] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-violet-500"
                      />
                    </div>

                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="bg-[#0B0D14] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-violet-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Students</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    <RefreshCw className="animate-spin mx-auto mb-3" />
                    Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No users found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[750px]">
                      <thead className="bg-white/[0.025] text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-5 py-4">User</th>
                          <th className="px-5 py-4">College ID</th>
                          <th className="px-5 py-4">Department</th>
                          <th className="px-5 py-4">Role</th>
                          <th className="px-5 py-4">Joined</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredUsers.map((item) => (
                          <tr
                            key={item.user_id}
                            className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-violet-500/15 text-violet-300 flex items-center justify-center font-semibold shrink-0">
                                  {item.full_name.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                  <p className="text-sm font-medium">
                                    {item.full_name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {item.college_id || '—'}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {item.department || '—'}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`text-xs px-3 py-1 rounded-full ${
                                  item.role === 'admin'
                                    ? 'bg-violet-500/15 text-violet-300'
                                    : 'bg-blue-500/10 text-blue-300'
                                }`}
                              >
                                {item.role}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-500">
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString()
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* MARKETPLACE */}
          {activeSection === 'Marketplace' && (
            <>
              <div className="mb-8">
                <p className="text-violet-400 text-xs font-semibold tracking-[2px] mb-2">
                  MARKETPLACE MANAGEMENT
                </p>

                <h1 className="text-2xl md:text-3xl font-bold">
                  Marketplace Listings
                </h1>

                <p className="text-gray-500 text-sm mt-2">
                  Monitor and manage student marketplace listings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#141824] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-gray-500 text-sm">Total Listings</p>
                  <p className="text-2xl font-bold mt-2">{listings.length}</p>
                </div>

                <div className="bg-[#141824] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-gray-500 text-sm">Available</p>
                  <p className="text-2xl font-bold mt-2 text-emerald-400">
                    {listings.filter((l) => l.is_available).length}
                  </p>
                </div>

                <div className="bg-[#141824] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-gray-500 text-sm">Removed</p>
                  <p className="text-2xl font-bold mt-2 text-red-400">
                    {listings.filter((l) => !l.is_available).length}
                  </p>
                </div>
              </div>

              <div className="bg-[#141824] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/[0.07] flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold">All Listings</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {filteredListings.length} listings found
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />

                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search listings..."
                        className="w-full sm:w-56 bg-[#0B0D14] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-violet-500"
                      />
                    </div>

                    <select
                      value={listingFilter}
                      onChange={(e) => setListingFilter(e.target.value)}
                      className="bg-[#0B0D14] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-violet-500"
                    >
                      <option value="all">All Listings</option>
                      <option value="available">Available</option>
                      <option value="removed">Removed</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    <RefreshCw className="animate-spin mx-auto mb-3" />
                    Loading listings...
                  </div>
                ) : filteredListings.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No listings found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[850px]">
                      <thead className="bg-white/[0.025] text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-5 py-4">Item</th>
                          <th className="px-5 py-4">Owner</th>
                          <th className="px-5 py-4">Type</th>
                          <th className="px-5 py-4">Price</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredListings.map((item) => (
                          <tr
                            key={item.listing_id}
                            className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium">
                                {item.item_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.category}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {item.owner_name || 'Unknown'}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {item.listing_type}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {item.price != null ? `₹${item.price}` : 'Free'}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`text-xs px-3 py-1 rounded-full ${
                                  item.is_available
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {item.is_available ? 'Available' : 'Removed'}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {item.is_available && (
                                <button
                                  onClick={() =>
                                    removeListing(item.listing_id, item.item_name)
                                  }
                                  disabled={loading}
                                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* LOST AND FOUND */}
          {activeSection === 'Lost & Found' && (
            <>
              <div className="mb-8">
                <p className="text-violet-400 text-xs font-semibold tracking-[2px] mb-2">
                  REPORT MANAGEMENT
                </p>

                <h1 className="text-2xl md:text-3xl font-bold">
                  Lost & Found Reports
                </h1>

                <p className="text-gray-500 text-sm mt-2">
                  Review reports and update their resolution status.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#141824] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-gray-500 text-sm">Total Reports</p>
                  <p className="text-2xl font-bold mt-2">{reports.length}</p>
                </div>

                <div className="bg-[#141824] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-gray-500 text-sm">Lost Items</p>
                  <p className="text-2xl font-bold mt-2 text-amber-400">
                    {reports.filter((r) => r.report_type === 'lost').length}
                  </p>
                </div>

                <div className="bg-[#141824] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-gray-500 text-sm">Found Items</p>
                  <p className="text-2xl font-bold mt-2 text-emerald-400">
                    {reports.filter((r) => r.report_type === 'found').length}
                  </p>
                </div>
              </div>

              <div className="bg-[#141824] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/[0.07] flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold">All Reports</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {filteredReports.length} reports found
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />

                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search reports..."
                        className="w-full sm:w-56 bg-[#0B0D14] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-violet-500"
                      />
                    </div>

                    <select
                      value={reportFilter}
                      onChange={(e) => setReportFilter(e.target.value)}
                      className="bg-[#0B0D14] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-violet-500"
                    >
                      <option value="all">All Reports</option>
                      <option value="lost">Lost Items</option>
                      <option value="found">Found Items</option>
                      <option value="open">Open</option>
                      <option value="matched">Matched</option>
                      <option value="reunited">Reunited</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    <RefreshCw className="animate-spin mx-auto mb-3" />
                    Loading reports...
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No reports found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[950px]">
                      <thead className="bg-white/[0.025] text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-5 py-4">Item</th>
                          <th className="px-5 py-4">Reporter</th>
                          <th className="px-5 py-4">Type</th>
                          <th className="px-5 py-4">Location</th>
                          <th className="px-5 py-4">Date</th>
                          <th className="px-5 py-4">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredReports.map((item) => (
                          <tr
                            key={item.report_id}
                            className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium">
                                {item.item_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.category}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {item.reporter_name || 'Unknown'}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`text-xs px-3 py-1 rounded-full ${
                                  item.report_type === 'lost'
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {item.report_type}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {item.location || '—'}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-500">
                              {item.date_lost_found
                                ? new Date(item.date_lost_found).toLocaleDateString()
                                : '—'}
                            </td>

                            <td className="px-5 py-4">
                              <select
                                value={item.status}
                                disabled={loading}
                                onChange={(e) =>
                                  updateReportStatus(
                                    item.report_id,
                                    e.target.value as AdminReport['status']
                                  )
                                }
                                className="bg-[#0B0D14] border border-white/[0.1] rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-violet-500 disabled:opacity-50"
                              >
                                <option value="open">Open</option>
                                <option value="matched">Matched</option>
                                <option value="reunited">Reunited</option>
                                <option value="resolved">Resolved</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* PROJECTS */}
          {activeSection === 'Projects' && (
            <div className="bg-[#141824] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.07]">
                <h2 className="font-semibold text-lg">Project Management</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {projects.length} projects registered
                </p>
              </div>

              {loading ? (
                <div className="p-10 text-center text-gray-500">
                  <RefreshCw className="animate-spin mx-auto mb-3" />
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  No projects found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px] text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-white/[0.025]">
                      <tr>
                        <th className="p-4">Project</th>
                        <th className="p-4">Owner</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Skills</th>
                        <th className="p-4">Team Size</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {projects.map((project) => (
                        <tr
                          key={project.project_id}
                          className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                        >
                          <td className="p-4">
                            <p className="text-sm font-medium">
                              {project.title}
                            </p>
                            <p className="text-xs text-gray-500 max-w-xs truncate">
                              {project.description}
                            </p>
                          </td>

                          <td className="p-4 text-sm text-gray-400">
                            {project.owner_name || 'Unknown'}
                          </td>

                          <td className="p-4 text-sm text-gray-400">
                            {project.category || '—'}
                          </td>

                          <td className="p-4 text-sm text-gray-400">
                            {Array.isArray(project.required_skills)
                              ? project.required_skills.join(', ')
                              : project.required_skills || '—'}
                          </td>

                          <td className="p-4 text-sm text-gray-400">
                            {project.team_size ?? '—'}
                          </td>

                          <td className="p-4 text-sm text-gray-400">
                            {project.status || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CAMPUS EVENTS */}
          {activeSection === 'Campus Events' && (
            <div className="bg-[#141824] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.07]">
                <h2 className="font-semibold text-lg">
                  Campus Events Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {events.length} events registered
                </p>
              </div>

              {loading ? (
                <div className="p-10 text-center text-gray-500">
                  <RefreshCw className="animate-spin mx-auto mb-3" />
                  Loading events...
                </div>
              ) : events.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  No events found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px] text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-white/[0.025]">
                      <tr>
                        <th className="p-4">Event</th>
                        <th className="p-4">Organizer</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Venue</th>
                      </tr>
                    </thead>

                    <tbody>
                      {events.map((event) => (
                        <tr
                          key={event.event_id}
                          className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                        >
                          <td className="p-4">
                            <p className="text-sm font-medium">
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-500 max-w-xs truncate">
                              {event.description}
                            </p>
                          </td>

                          <td className="p-4 text-sm text-gray-400">
                            {event.organizer_name || 'Unknown'}
                          </td>

                          <td className="p-4 text-sm text-gray-400">
                            {event.category || '—'}
                          </td>

                          <td className="p-4 text-sm text-gray-400">
                            {event.event_date
                              ? new Date(event.event_date).toLocaleDateString()
                              : '—'}
                          </td>

                          <td className="p-4 text-sm text-gray-400">
                            {event.venue || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default Admin
