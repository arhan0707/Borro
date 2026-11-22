
import express from 'express'
import { pool } from '../config/db.js'
import authenticateToken from '../middleware/authMiddleware.js'

const router = express.Router()

// Helper: Create notification without interrupting the main action
async function createNotification(user_id, message, notification_type, related_id) {
    try {
        await pool.query(
            `INSERT INTO notifications (
                user_id,
                message,
                notification_type,
                related_id,
                is_read
            )
            VALUES ($1, $2, $3, $4, FALSE)`,
            [user_id, message, notification_type, related_id]
        )
    } catch (error) {
        console.error('Notification creation failed:', error.message)
    }
}


// GET: All available projects
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.*,
                u.full_name AS owner_name
            FROM projects p
            JOIN users u ON p.owner_id = u.user_id
            WHERE p.status = 'open'
            ORDER BY p.created_at DESC
        `)

        res.json({
            success: true,
            count: result.rows.length,
            projects: result.rows
        })
    } catch (error) {
        console.error('Error fetching projects:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects'
        })
    }
})


// GET: Applications submitted by logged-in student
router.get('/my-applications', authenticateToken, async (req, res) => {
    try {
        const student_id = req.user.user_id

        const result = await pool.query(
            `SELECT
                a.*,
                p.title AS project_title,
                p.category,
                u.full_name AS owner_name
             FROM project_applications a
             JOIN projects p ON a.project_id = p.project_id
             JOIN users u ON p.owner_id = u.user_id
             WHERE a.student_id = $1
             ORDER BY a.applied_at DESC`,
            [student_id]
        )

        res.json({
            success: true,
            count: result.rows.length,
            applications: result.rows
        })
    } catch (error) {
        console.error('Error fetching student applications:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your applications'
        })
    }
})


// POST: Create a new project
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            required_skills,
            team_size
        } = req.body

        const owner_id = req.user.user_id

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Project title is required'
            })
        }

        const result = await pool.query(
            `INSERT INTO projects (
                owner_id,
                title,
                description,
                category,
                required_skills,
                team_size
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                owner_id,
                title.trim(),
                description || null,
                category || null,
                required_skills || null,
                team_size ?? 2
            ]
        )

        res.status(201).json({
            success: true,
            message: 'Project created successfully!',
            project: result.rows[0]
        })
    } catch (error) {
        console.error('Error creating project:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to create project'
        })
    }
})


// POST: Apply to join a project
router.post('/:id/applications', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const { message } = req.body
        const student_id = req.user.user_id

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            })
        }

        const projectResult = await pool.query(
            `SELECT owner_id, status, title
             FROM projects
             WHERE project_id = $1`,
            [id]
        )

        if (projectResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            })
        }

        const project = projectResult.rows[0]

        if (project.status !== 'open') {
            return res.status(400).json({
                success: false,
                message: 'This project is not accepting applications'
            })
        }

        if (Number(project.owner_id) === Number(student_id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot apply to your own project'
            })
        }

        const result = await pool.query(
            `INSERT INTO project_applications (
                project_id,
                student_id,
                message
            )
            VALUES ($1, $2, $3)
            RETURNING *`,
            [id, student_id, message || null]
        )

        const application = result.rows[0]

        // Notify project owner
        const studentResult = await pool.query(
            `SELECT full_name
             FROM users
             WHERE user_id = $1`,
            [student_id]
        )

        const studentName =
            studentResult.rows[0]?.full_name || 'A student'

        await createNotification(
            project.owner_id,
            `${studentName} applied to join your project "${project.title}".`,
            'project_application',
            application.application_id
        )

        res.status(201).json({
            success: true,
            message: 'Project application submitted successfully!',
            application
        })
    } catch (error) {
        console.error('Error submitting application:', error)

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'You have already applied to this project'
            })
        }

        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'Student account not found'
            })
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit application'
        })
    }
})


// GET: All applications for a specific project (owner only)
router.get('/:id/applications', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const user_id = req.user.user_id

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            })
        }

        const projectCheck = await pool.query(
            `SELECT owner_id
             FROM projects
             WHERE project_id = $1`,
            [id]
        )

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            })
        }

        if (Number(projectCheck.rows[0].owner_id) !== Number(user_id)) {
            return res.status(403).json({
                success: false,
                message: 'Only the project owner can view applications'
            })
        }

        const result = await pool.query(
            `SELECT
                a.*,
                u.full_name AS student_name,
                u.email AS student_email,
                p.title AS project_title
             FROM project_applications a
             JOIN users u ON a.student_id = u.user_id
             JOIN projects p ON a.project_id = p.project_id
             WHERE a.project_id = $1
             ORDER BY a.applied_at DESC`,
            [id]
        )

        res.json({
            success: true,
            count: result.rows.length,
            applications: result.rows
        })
    } catch (error) {
        console.error('Error fetching applications:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications'
        })
    }
})


// PATCH: Accept or reject an application (owner only)
router.patch('/:id/applications/:applicationId', authenticateToken, async (req, res) => {
    try {
        const { id, applicationId } = req.params
        const { status } = req.body
        const owner_id = req.user.user_id

        if (!/^\d+$/.test(id) || !/^\d+$/.test(applicationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project or application ID'
            })
        }

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be accepted or rejected'
            })
        }

        const result = await pool.query(
            `UPDATE project_applications a
             SET status = $1
             FROM projects p
             WHERE a.project_id = p.project_id
               AND a.project_id = $2
               AND a.application_id = $3
               AND p.owner_id = $4
               AND a.status = 'pending'
             RETURNING a.*`,
            [status, id, applicationId, owner_id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found, not pending, or you are not the owner'
            })
        }

        const application = result.rows[0]

        // Get project title for notification
        const projectResult = await pool.query(
            `SELECT title
             FROM projects
             WHERE project_id = $1`,
            [id]
        )

        const projectTitle =
            projectResult.rows[0]?.title || 'your project'

        // Notify applicant
        await createNotification(
            application.student_id,
            status === 'accepted'
                ? `Your application for "${projectTitle}" has been accepted!`
                : `Your application for "${projectTitle}" has been rejected.`,
            `project_application_${status}`,
            application.application_id
        )

        res.json({
            success: true,
            message: `Application ${status} successfully!`,
            application
        })
    } catch (error) {
        console.error('Error updating application:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update application'
        })
    }
})

export default router
