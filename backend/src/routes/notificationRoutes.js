
import express from 'express'
import { pool } from '../config/db.js'
import authenticateToken from '../middleware/authMiddleware.js'

const router = express.Router()

// GET: All notifications for logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.user.user_id]
        )

        res.json({
            success: true,
            count: result.rows.length,
            notifications: result.rows
        })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        })
    }
})

// GET: Unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) AS unread_count
             FROM notifications
             WHERE user_id = $1 AND is_read = FALSE`,
            [req.user.user_id]
        )

        res.json({
            success: true,
            unread_count: Number(result.rows[0].unread_count)
        })
    } catch (error) {
        console.error('Error fetching unread count:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count'
        })
    }
})

// PATCH: Mark one notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            })
        }

        const result = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE notification_id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.user_id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            })
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
            notification: result.rows[0]
        })
    } catch (error) {
        console.error('Error marking notification as read:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update notification'
        })
    }
})

// PATCH: Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = $1 AND is_read = FALSE
             RETURNING notification_id`,
            [req.user.user_id]
        )

        res.json({
            success: true,
            message: 'All notifications marked as read',
            count: result.rows.length
        })
    } catch (error) {
        console.error('Error marking all notifications as read:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update notifications'
        })
    }
})

// DELETE: Delete one notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            })
        }

        const result = await pool.query(
            `DELETE FROM notifications
             WHERE notification_id = $1 AND user_id = $2
             RETURNING notification_id`,
            [id, req.user.user_id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            })
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting notification:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        })
    }
})

export default router
