
import express from 'express'
import { pool } from '../config/db.js'
import authenticateToken from '../middleware/authMiddleware.js'

const router = express.Router()

// Get all upcoming campus events
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                e.*,
                u.full_name AS organizer_name
            FROM events e
            LEFT JOIN users u
                ON e.organizer_id = u.user_id
            WHERE e.event_date >= CURRENT_TIMESTAMP
            ORDER BY e.event_date ASC
        `)

        res.json({
            success: true,
            count: result.rows.length,
            events: result.rows
        })

    } catch (error) {
        console.error('Error fetching events:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch campus events'
        })
    }
})


 // Create a new campus event
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            event_date,
            venue,
            registration_url
        } = req.body

        const organizer_id = req.user.user_id

        if (!title || !event_date) {
            return res.status(400).json({
                success: false,
                message: 'Event title and event date are required'
            })
        }

        const result = await pool.query(
            `INSERT INTO events (
                organizer_id,
                title,
                description,
                category,
                event_date,
                venue,
                registration_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                organizer_id,
                title,
                description || null,
                category || null,
                event_date,
                venue || null,
                registration_url || null
            ]
        )

        res.status(201).json({
            success: true,
            message: 'Campus event created successfully!',
            event: result.rows[0]
        })

    } catch (error) {
        console.error('Error creating event:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to create campus event'
        })
    }
})


 // Update a campus event
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const organizer_id = req.user.user_id

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            })
        }

        const {
            title,
            description,
            category,
            event_date,
            venue,
            registration_url
        } = req.body

        const result = await pool.query(
            `UPDATE events
             SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                event_date = COALESCE($4, event_date),
                venue = COALESCE($5, venue),
                registration_url = COALESCE($6, registration_url)
             WHERE event_id = $7
                AND organizer_id = $8
             RETURNING *`,
            [
                title ?? null,
                description ?? null,
                category ?? null,
                event_date ?? null,
                venue ?? null,
                registration_url ?? null,
                id,
                organizer_id
            ]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            })
        }

        res.json({
            success: true,
            message: 'Campus event updated successfully!',
            event: result.rows[0]
        })

    } catch (error) {
        console.error('Error updating event:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to update campus event'
        })
    }
})


 // Delete a campus event
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const organizer_id = req.user.user_id


        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            })
        }

        const result = await pool.query(
            `DELETE FROM events
             WHERE event_id = $1
                AND organizer_id = $2
             RETURNING *`,
            [id, organizer_id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            })
        }

        res.json({
            success: true,
            message: 'Campus event deleted successfully!',
            event: result.rows[0]
        })

    } catch (error) {
        console.error('Error deleting event:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to delete campus event'
        })
    }
})

export default router
