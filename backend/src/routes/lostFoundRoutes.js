
import express from 'express'
import { pool } from '../config/db.js'
import authenticateToken from '../middleware/authMiddleware.js'

const router = express.Router()

// Get all lost and found reports
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.*,
                u.full_name AS reporter_name
            FROM lost_found_reports r
            JOIN users u ON r.user_id = u.user_id
            ORDER BY r.created_at DESC
        `)

        res.json({
            success: true,
            count: result.rows.length,
            reports: result.rows
        })

    } catch (error) {
        console.error('Error fetching reports:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch lost and found reports'
        })
    }
})


 // Create a lost or found report
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            item_name,
            report_type,
            category,
            description,
            location,
            date_lost_found,
            image_url
        } = req.body

        const user_id = req.user.user_id

        if (!item_name || !report_type) {
            return res.status(400).json({
                success: false,
                message: 'Item name and report type are required'
            })
        }

        if (!['lost', 'found'].includes(report_type)) {
            return res.status(400).json({
                success: false,
                message: 'Report type must be lost or found'
            })
        }

        const result = await pool.query(
            `INSERT INTO lost_found_reports (
                user_id,
                item_name,
                report_type,
                category,
                description,
                location,
                date_lost_found,
                image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                user_id,
                item_name,
                report_type,
                category || null,
                description || null,
                location || null,
                date_lost_found || null,
                image_url || null
            ]
        )

        res.status(201).json({
            success: true,
            message: 'Lost & Found report created successfully!',
            report: result.rows[0]
        })

    } catch (error) {
        console.error('Error creating report:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to create report'
        })
    }
})


 // Update Lost & Found report status
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body
        const user_id = req.user.user_id

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID'
            })
        }

        const allowedStatuses = [
            'open',
            'matched',
            'reunited',
            'resolved'
        ]

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report status'
            })
        }

        const result = await pool.query(
            `UPDATE lost_found_reports
             SET status = $1
             WHERE report_id = $2
                AND user_id = $3
             RETURNING *`,
            [status, id, user_id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            })
        }

        res.json({
            success: true,
            message: 'Report status updated successfully!',
            report: result.rows[0]
        })

    } catch (error) {
        console.error('Error updating report:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to update report status'
        })
    }
})

export default router
