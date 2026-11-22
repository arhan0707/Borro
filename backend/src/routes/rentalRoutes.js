
import express from 'express'
import { pool } from '../config/db.js'
import authenticateToken from '../middleware/authMiddleware.js'

const router = express.Router()

// Helper: Create notification without interrupting rental actions
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

// GET: All rental requests belonging to logged-in student
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                r.*,
                l.item_name,
                l.owner_id,
                u.full_name AS requester_name
             FROM rental_requests r
             JOIN listings l ON r.listing_id = l.listing_id
             JOIN users u ON r.requester_id = u.user_id
             WHERE r.requester_id = $1 OR l.owner_id = $1
             ORDER BY r.request_date DESC`,
            [req.user.user_id]
        )

        res.json({
            success: true,
            count: result.rows.length,
            requests: result.rows
        })
    } catch (error) {
        console.error('Error fetching rental requests:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rental requests'
        })
    }
})

// POST: Create a rental request
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { listing_id, start_date, end_date } = req.body
        const requester_id = req.user.user_id

        if (!listing_id || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Listing, start date and end date are required'
            })
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/
        const startDate = new Date(`${start_date}T00:00:00.000Z`)
        const endDate = new Date(`${end_date}T00:00:00.000Z`)

        const today = new Date()
        const todayString = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0')
        ].join('-')

        if (
            !datePattern.test(start_date) ||
            !datePattern.test(end_date) ||
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            startDate.toISOString().slice(0, 10) !== start_date ||
            endDate.toISOString().slice(0, 10) !== end_date
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            })
        }

        if (start_date < todayString) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            })
        }

        if (end_date < start_date) {
            return res.status(400).json({
                success: false,
                message: 'End date cannot be before start date'
            })
        }

        const listingResult = await pool.query(
            `SELECT owner_id, price, is_available, listing_type, item_name
             FROM listings
             WHERE listing_id = $1`,
            [listing_id]
        )

        if (listingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            })
        }

        const listing = listingResult.rows[0]

        if (listing.listing_type !== 'rent') {
            return res.status(400).json({
                success: false,
                message: 'This item is not available for rent'
            })
        }

        if (!listing.is_available) {
            return res.status(400).json({
                success: false,
                message: 'This item is currently unavailable'
            })
        }

        if (Number(listing.owner_id) === Number(requester_id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot request your own item'
            })
        }

        const days =
            Math.floor(
                (endDate.getTime() - startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1

        const total_amount = Number(listing.price) * days

        const result = await pool.query(
            `INSERT INTO rental_requests (
                listing_id,
                requester_id,
                start_date,
                end_date,
                total_amount
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [listing_id, requester_id, start_date, end_date, total_amount]
        )

        const rentalRequest = result.rows[0]

        // Notify item owner
        await createNotification(
            listing.owner_id,
            `New rental request for "${listing.item_name}".`,
            'rental_request',
            rentalRequest.request_id
        )

        res.status(201).json({
            success: true,
            message: 'Rental request created successfully!',
            rental_request: rentalRequest
        })
    } catch (error) {
        console.error('Error creating rental request:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to create rental request'
        })
    }
})

// PATCH: Approve or reject a rental request
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body
        const owner_id = req.user.user_id

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request ID'
            })
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be approved or rejected'
            })
        }

        const result = await pool.query(
            `UPDATE rental_requests r
             SET status = $1
             FROM listings l
             WHERE r.listing_id = l.listing_id
                AND r.request_id = $2
                AND l.owner_id = $3
                AND r.status = 'pending'
                AND (
                    $1 <> 'approved'
                    OR NOT EXISTS (
                        SELECT 1
                        FROM rental_requests other
                        WHERE other.listing_id = r.listing_id
                            AND other.request_id <> r.request_id
                            AND other.status = 'approved'
                            AND other.start_date <= r.end_date
                            AND other.end_date >= r.start_date
                    )
                )
             RETURNING r.*`,
            [status, id, owner_id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found, not pending, you are not the owner, or dates conflict with another approved rental'
            })
        }

        const rentalRequest = result.rows[0]

        const listingResult = await pool.query(
            `SELECT item_name
             FROM listings
             WHERE listing_id = $1`,
            [rentalRequest.listing_id]
        )

        const itemName = listingResult.rows[0]?.item_name || 'your item'

        // Notify requester
        await createNotification(
            rentalRequest.requester_id,
            status === 'approved'
                ? `Your rental request for "${itemName}" was approved.`
                : `Your rental request for "${itemName}" was rejected.`,
            `rental_${status}`,
            rentalRequest.request_id
        )

        res.json({
            success: true,
            message: `Rental request ${status} successfully!`,
            rental_request: rentalRequest
        })
    } catch (error) {
        console.error('Error updating rental request:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update rental request'
        })
    }
})

// PATCH: Mark an approved rental as completed
router.patch('/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const owner_id = req.user.user_id

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request ID'
            })
        }

        const result = await pool.query(
            `UPDATE rental_requests r
             SET status = 'completed'
             FROM listings l
             WHERE r.listing_id = l.listing_id
                AND r.request_id = $1
                AND l.owner_id = $2
                AND r.status = 'approved'
             RETURNING r.*`,
            [id, owner_id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found, not approved, or you are not the owner'
            })
        }

        res.json({
            success: true,
            message: 'Rental completed successfully!',
            rental_request: result.rows[0]
        })
    } catch (error) {
        console.error('Error completing rental:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to complete rental'
        })
    }
})

export default router
