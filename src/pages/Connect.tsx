
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  Users,
  ArrowUpRight,
  Plus,
  X,
  RefreshCw,
} from 'lucide-react'
import { apiRequest } from '../services/api'
import { useAuth } from '../context/AuthContext'

type Project = {
  project_id: number
  owner_id: number
  owner_name?: string
  title: string
  description?: string
  category?: string
  required_skills?: string | string[]
  team_size: number
  status: string
  created_at: string
}

type Application = {
  application_id: number
  project_id: number
  student_id: number
  student_name: string
  student_email: string
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  applied_at: string
  project_title?: string
}

type MyApplication = {
  application_id: number
  project_id: number
  student_id: number
  project_title: string
  category?: string
  owner_name?: string
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  applied_at: string
}

const initialForm = {
  title: '',
  description: '',
  category: 'Web Development',
  required_skills: '',
  team_size: '2',
}

export default function Connect() {
  const { user } = useAuth()

  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [activeTab, setActiveTab] = useState<'projects' | 'applications'>('projects')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applying, setApplying] = useState(false)

  const [applications, setApplications] = useState<Application[]>([])
  const [projectApplicationsLoading, setProjectApplicationsLoading] = useState(false)
  const [updatingApplication, setUpdatingApplication] = useState<number | null>(null)

  const [myApplications, setMyApplications] = useState<MyApplication[]>([])
  const [myApplicationsLoading, setMyApplicationsLoading] = useState(false)

  // Load all open projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const data = await apiRequest('/projects')

      const rows = Array.isArray(data)
        ? data
        : data.projects || data.data || []

      setProjects(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Load applications submitted by the logged-in student
  const loadMyApplications = useCallback(async () => {
    if (!user) {
      setMyApplications([])
      return
    }

    try {
      setMyApplicationsLoading(true)
      setError('')

      const data = await apiRequest('/projects/my-applications')

      const rows = Array.isArray(data)
        ? data
        : data.applications || data.data || []

      setMyApplications(rows)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your applications'
      )
    } finally {
      setMyApplicationsLoading(false)
    }
  }, [user])

  // Search projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const skills = Array.isArray(project.required_skills)
        ? project.required_skills.join(' ')
        : project.required_skills || ''

      const searchableText = [
        project.title,
        project.description || '',
        project.category || '',
        skills,
        project.owner_name || '',
      ].join(' ').toLowerCase()

      return searchableText.includes(search.toLowerCase())
    })
  }, [projects, search])

  // Convert skills into an array for display
  function getSkills(skills?: string | string[]) {
    if (!skills) return []

    if (Array.isArray(skills)) {
      return skills
    }

    return skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
  }

  // Create a project
  async function handleCreateProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!user) {
      setError('Please log in to post a project.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          required_skills: form.required_skills,
          team_size: Number(form.team_size),
        }),
      })

      setForm(initialForm)
      setShowForm(false)
      setMessage('Project published successfully!')
      setActiveTab('projects')

      await loadProjects()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create project'
      )
    } finally {
      setSaving(false)
    }
  }

  // Apply to join a project
  async function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!user || !selectedProject) {
      setError('Please log in to apply for a project.')
      return
    }

    try {
      setApplying(true)
      setError('')
      setMessage('')

      await apiRequest(
        `/projects/${selectedProject.project_id}/applications`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: applicationMessage,
          }),
        }
      )

      setMessage('Your application has been submitted successfully!')
      setSelectedProject(null)
      setApplicationMessage('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not submit application'
      )
    } finally {
      setApplying(false)
    }
  }

  // Load applications for a project (owner only)
  async function loadProjectApplications(project: Project) {
    try {
      setProjectApplicationsLoading(true)
      setError('')

      const data = await apiRequest(
        `/projects/${project.project_id}/applications`
      )

      const rows = Array.isArray(data)
        ? data
        : data.applications || data.data || []

      setApplications(rows)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load applications'
      )
    } finally {
      setProjectApplicationsLoading(false)
    }
  }

  // Accept or reject an application
  async function updateApplication(
    projectId: number,
    applicationId: number,
    status: 'accepted' | 'rejected'
  ) {
    try {
      setUpdatingApplication(applicationId)
      setError('')
      setMessage('')

      await apiRequest(
        `/projects/${projectId}/applications/${applicationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      )

      setMessage(`Application ${status} successfully!`)

      if (selectedProject) {
        await loadProjectApplications(selectedProject)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update application'
      )
    } finally {
      setUpdatingApplication(null)
    }
  }

  function openProject(project: Project) {
    setError('')
    setMessage('')
    setApplications([])
    setApplicationMessage('')
    setSelectedProject(project)

    // Load applications automatically for the project owner
    if (Number(project.owner_id) === Number(user?.user_id)) {
      loadProjectApplications(project)
    }
  }

  function closeProjectModal() {
    setSelectedProject(null)
    setApplications([])
    setApplicationMessage('')
  }

  function applicationStatusStyle(status: string) {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <main
      className="min-h-screen px-6 md:px-16 py-14 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <p
            className="text-sm uppercase tracking-widest font-medium"
            style={{ color: 'var(--accent)' }}
          >
            BORRO CONNECT
          </p>

          <h1 className="text-4xl md:text-5xl font-semibold mt-3">
            Great ideas need
            <br />
            great people.
          </h1>

          <p className="mt-4" style={{ color: 'var(--muted)' }}>
            Find teammates, explore projects and build something together.
          </p>
        </div>

        <div className="flex gap-3 self-start">
          <button
            onClick={() => {
              if (activeTab === 'projects') {
                loadProjects()
              } else {
                loadMyApplications()
              }
            }}
            className="flex items-center gap-2 rounded-full border px-4 py-3"
            style={{ borderColor: 'var(--border)' }}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>

          <button
            onClick={() => {
              setError('')
              setMessage('')
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#24364b] text-white hover:bg-[#354b64]"
          >
            <Plus size={18} />
            Post a project
          </button>
        </div>
      </div>

      {/* Messages */}
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

      {/* Tabs */}
      <div
        className="flex gap-5 mt-10 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => setActiveTab('projects')}
          className="px-4 py-3 border-b-2 text-sm font-semibold"
          style={{
            borderColor:
              activeTab === 'projects' ? 'var(--accent)' : 'transparent',
          }}
        >
          Explore Projects
        </button>

        <button
          onClick={() => {
            setActiveTab('applications')
            loadMyApplications()
          }}
          className="px-4 py-3 border-b-2 text-sm font-semibold"
          style={{
            borderColor:
              activeTab === 'applications' ? 'var(--accent)' : 'transparent',
          }}
        >
          My Applications
        </button>
      </div>

      {/* Explore Projects */}
      {activeTab === 'projects' && (
        <>
          {/* Search */}
          <div
            className="flex items-center gap-3 rounded-full px-5 py-4 mt-8 border max-w-2xl"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <Search size={20} style={{ color: 'var(--muted)' }} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects, skills or categories..."
              className="outline-none w-full bg-transparent text-sm"
            />
          </div>

          {/* Project count */}
          <div className="flex justify-between items-center mt-12 mb-6">
            <h2 className="text-2xl font-semibold">Explore projects</h2>

            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {filteredProjects.length} projects
            </span>
          </div>

          {/* Project cards */}
          {loading ? (
            <p className="py-10">Loading projects...</p>
          ) : filteredProjects.length === 0 ? (
            <div
              className="rounded-2xl border py-16 text-center"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--muted)',
              }}
            >
              No projects found. Try another search or post a project.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredProjects.map((project) => (
                <div
                  key={project.project_id}
                  className="p-7 rounded-2xl border hover:shadow-md transition"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--accent)' }}
                    >
                      {project.category || 'General'}
                    </span>

                    <Users size={20} style={{ color: 'var(--muted)' }} />
                  </div>

                  <h3 className="text-xl font-semibold mt-4">
                    {project.title}
                  </h3>

                  <p
                    className="text-sm mt-3 leading-relaxed"
                    style={{ color: 'var(--muted)' }}
                  >
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-5">
                    {getSkills(project.required_skills).map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="text-xs px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div
                    className="flex justify-between items-center mt-7 pt-5 border-t gap-3"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        Team size: {project.team_size}
                      </p>

                      <p
                        className="text-xs mt-1"
                        style={{ color: 'var(--muted)' }}
                      >
                        Posted by {project.owner_name || 'Student'}
                      </p>
                    </div>

                    <button
                      onClick={() => openProject(project)}
                      className="flex items-center gap-2 text-sm font-medium"
                      style={{ color: 'var(--text)' }}
                    >
                      View project <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Applications */}
      {activeTab === 'applications' && (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-semibold">My Applications</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                Track the status of projects you've applied to.
              </p>
            </div>

            <button
              onClick={loadMyApplications}
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          {!user ? (
            <div
              className="rounded-2xl border p-10 text-center"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              Please log in to view your applications.
            </div>
          ) : myApplicationsLoading ? (
            <p className="py-10">Loading your applications...</p>
          ) : myApplications.length === 0 ? (
            <div
              className="rounded-2xl border py-16 text-center"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <Users size={35} className="mx-auto mb-4" />

              <h3 className="text-lg font-semibold">
                No applications yet
              </h3>

              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                Apply to projects to see their status here.
              </p>

              <button
                onClick={() => setActiveTab('projects')}
                className="mt-5 rounded-xl px-5 py-3 text-sm font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                Explore Projects
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((application) => (
                <article
                  key={application.application_id}
                  className="rounded-2xl border p-5"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {application.project_title}
                      </h3>

                      <p
                        className="mt-1 text-sm"
                        style={{ color: 'var(--muted)' }}
                      >
                        {application.category || 'General'}
                      </p>

                      <p
                        className="mt-2 text-sm"
                        style={{ color: 'var(--muted)' }}
                      >
                        Project owner: {application.owner_name || 'Student'}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${applicationStatusStyle(application.status)}`}
                    >
                      {application.status}
                    </span>
                  </div>

                  {application.message && (
                    <p
                      className="mt-4 text-sm"
                      style={{ color: 'var(--muted)' }}
                    >
                      Your message: {application.message}
                    </p>
                  )}

                  <p
                    className="mt-4 text-xs"
                    style={{ color: 'var(--muted)' }}
                  >
                    Applied on:{' '}
                    {application.applied_at
                      ? new Date(application.applied_at).toLocaleDateString()
                      : 'Date unavailable'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Create Project Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={handleCreateProject}
            className="my-8 w-full max-w-xl rounded-2xl p-6"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Post a Project</h2>

              <button type="button" onClick={() => setShowForm(false)}>
                <X size={21} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Project title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="rounded-xl border p-3 sm:col-span-2"
              />

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="rounded-xl border p-3 sm:col-span-2"
              >
                <option>Web Development</option>
                <option>App Development</option>
                <option>Artificial Intelligence</option>
                <option>Cybersecurity</option>
                <option>Data Science</option>
                <option>Game Development</option>
                <option>Other</option>
              </select>

              <input
                required
                type="number"
                min="2"
                max="100"
                value={form.team_size}
                onChange={(e) =>
                  setForm({ ...form, team_size: e.target.value })
                }
                placeholder="Team size"
                className="rounded-xl border p-3 sm:col-span-2"
              />

              <input
                placeholder="Required skills (comma separated)"
                value={form.required_skills}
                onChange={(e) =>
                  setForm({ ...form, required_skills: e.target.value })
                }
                className="rounded-xl border p-3 sm:col-span-2"
              />

              <textarea
                required
                placeholder="Describe your project and the teammates you need..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="min-h-28 rounded-xl border p-3 sm:col-span-2"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-xl bg-[#24364b] py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish Project'}
            </button>
          </form>
        </div>
      )}

      {/* Project Details / Owner Applications Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div
            className="my-8 w-full max-w-xl rounded-2xl p-6"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Project Details</h2>

              <button onClick={closeProjectModal}>
                <X size={21} />
              </button>
            </div>

            <p className="text-sm" style={{ color: 'var(--accent)' }}>
              {selectedProject.category || 'General'}
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {selectedProject.title}
            </h3>

            <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
              {selectedProject.description || 'No description provided.'}
            </p>

            <div className="mt-5">
              <p className="text-sm font-semibold">Required skills</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {getSkills(selectedProject.required_skills).map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-full px-3 py-1.5 text-xs"
                    style={{ backgroundColor: 'var(--bg)' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <p>Team size: {selectedProject.team_size}</p>
              <p>Project owner: {selectedProject.owner_name || 'Student'}</p>
            </div>

            {Number(selectedProject.owner_id) === Number(user?.user_id) ? (
              <div
                className="mt-7 border-t pt-5"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold">Project Applications</h4>

                  <button
                    onClick={() => loadProjectApplications(selectedProject)}
                    className="text-xs underline"
                  >
                    Refresh
                  </button>
                </div>

                {projectApplicationsLoading ? (
                  <p className="text-sm">Loading applications...</p>
                ) : applications.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    No applications received yet.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-4 overflow-y-auto">
                    {applications.map((application) => (
                      <div
                        key={application.application_id}
                        className="rounded-xl border p-4"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {application.student_name}
                            </p>

                            <p
                              className="mt-1 text-xs"
                              style={{ color: 'var(--muted)' }}
                            >
                              {application.student_email}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${applicationStatusStyle(application.status)}`}
                          >
                            {application.status}
                          </span>
                        </div>

                        {application.message && (
                          <p
                            className="mt-3 text-sm"
                            style={{ color: 'var(--muted)' }}
                          >
                            {application.message}
                          </p>
                        )}

                        {application.status === 'pending' && (
                          <div className="mt-4 flex gap-2">
                            <button
                              disabled={updatingApplication === application.application_id}
                              onClick={() =>
                                updateApplication(
                                  selectedProject.project_id,
                                  application.application_id,
                                  'accepted'
                                )
                              }
                              className="rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              style={{ background: 'var(--accent)' }}
                            >
                              {updatingApplication === application.application_id
                                ? 'Updating...'
                                : 'Accept'}
                            </button>

                            <button
                              disabled={updatingApplication === application.application_id}
                              onClick={() =>
                                updateApplication(
                                  selectedProject.project_id,
                                  application.application_id,
                                  'rejected'
                                )
                              }
                              className="rounded-lg border px-4 py-2 text-xs font-semibold disabled:opacity-50"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleApply}
                className="mt-7 border-t pt-5"
                style={{ borderColor: 'var(--border)' }}
              >
                <h4 className="mb-3 font-semibold">
                  Apply to join this project
                </h4>

                <textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  placeholder="Tell the project owner why you'd like to join..."
                  className="min-h-24 w-full rounded-xl border p-3 text-sm"
                  style={{
                    background: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />

                <button
                  type="submit"
                  disabled={applying}
                  className="mt-4 w-full rounded-xl bg-[#24364b] py-3 font-semibold text-white disabled:opacity-50"
                >
                  {applying ? 'Submitting...' : 'Apply to Join'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
