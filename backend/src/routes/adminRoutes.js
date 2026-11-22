
import express from 'express'
import { pool } from '../config/db.js'
import authenticateToken, {
  authorizeAdmin,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// Protect every admin route
router.use(authenticateToken, authorizeAdmin)


// ==========================================
// 1. DASHBOARD STATISTICS
// ==========================================

router.get('/stats', async (req, res) => {
  try {
    const [
      users,
      listings,
      reports,
      projects,
      events,
      rentals,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),

      pool.query(
        'SELECT COUNT(*) FROM listings WHERE is_available = TRUE'
      ),

      pool.query('SELECT COUNT(*) FROM lost_found_reports'),

      pool.query('SELECT COUNT(*) FROM projects'),

      pool.query('SELECT COUNT(*) FROM events'),

      pool.query('SELECT COUNT(*) FROM rental_requests'),
    ])

    res.json({
      success: true,
      stats: {
        total_users: users.rows[0].count,
        active_listings: listings.rows[0].count,
        total_reports: reports.rows[0].count,
        total_projects: projects.rows[0].count,
        total_events: events.rows[0].count,
        total_rental_requests: rentals.rows[0].count,
      },
    })
  } catch (error) {
    console.error('Admin stats error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    })
  }
})


// ==========================================
// 2. USER MANAGEMENT
// ==========================================

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        user_id,
        full_name,
        email,
        college_id,
        department,
        role,
        created_at
      FROM users
      ORDER BY created_at DESC
    `)

    res.json({
      success: true,
      users: result.rows,
    })
  } catch (error) {
    console.error('Admin users error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    })
  }
})


// ==========================================
// 3. MARKETPLACE MANAGEMENT
// ==========================================

// Get all marketplace listings
router.get('/listings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        l.*,
        u.full_name AS owner_name
      FROM listings l
      LEFT JOIN users u
        ON l.owner_id = u.user_id
      ORDER BY l.created_at DESC
    `)

    res.json({
      success: true,
      listings: result.rows,
    })
  } catch (error) {
    console.error('Admin listings error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketplace listings',
    })
  }
})


// Soft-remove a marketplace listing
router.delete('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      UPDATE listings
      SET is_available = FALSE
      WHERE listing_id = $1
      RETURNING listing_id, item_name
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      })
    }

    res.json({
      success: true,
      message: 'Listing removed successfully',
      listing: result.rows[0],
    })
  } catch (error) {
    console.error('Admin remove listing error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to remove listing',
    })
  }
})


// ==========================================
// 4. LOST & FOUND MANAGEMENT
// ==========================================

// Get all lost and found reports
router.get('/reports', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.*,
        u.full_name AS reporter_name
      FROM lost_found_reports r
      LEFT JOIN users u
        ON r.user_id = u.user_id
      ORDER BY r.created_at DESC
    `)

    res.json({
      success: true,
      reports: result.rows,
    })
  } catch (error) {
    console.error('Admin reports error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch Lost & Found reports',
    })
  }
})


// Update report status
router.patch('/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowedStatuses = [
      'open',
      'matched',
      'reunited',
      'resolved',
    ]

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report status',
      })
    }

    const result = await pool.query(
      `
      UPDATE lost_found_reports
      SET status = $1
      WHERE report_id = $2
      RETURNING report_id, item_name, status
      `,
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      })
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      report: result.rows[0],
    })
  } catch (error) {
    console.error('Admin update report error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
    })
  }
})


// ==========================================
// 5. PROJECT MANAGEMENT
// ==========================================

// Get all projects
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        u.full_name AS owner_name
      FROM projects p
      LEFT JOIN users u
        ON p.owner_id = u.user_id
      ORDER BY p.created_at DESC
    `)

    res.json({
      success: true,
      projects: result.rows,
    })
  } catch (error) {
    console.error('Admin projects error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
    })
  }
})


// ==========================================
// 6. CAMPUS EVENTS MANAGEMENT
// ==========================================

// Get all campus events
router.get('/events', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.*,
        u.full_name AS organizer_name
      FROM events e
      LEFT JOIN users u
        ON e.organizer_id = u.user_id
      ORDER BY e.event_date DESC
    `)

    res.json({
      success: true,
      events: result.rows,
    })
  } catch (error) {
    console.error('Admin events error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch campus events',
    })
  }
})


export default router
