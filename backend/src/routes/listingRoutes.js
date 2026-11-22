
import express from 'express'
import { pool } from '../config/db.js'
import authenticateToken from '../middleware/authMiddleware.js'

const router = express.Router()

// Get all available marketplace listings
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                l.*,
                u.full_name AS owner_name
            FROM listings l
            JOIN users u ON l.owner_id = u.user_id
            WHERE l.is_available = TRUE
            ORDER BY l.created_at DESC
        `)

        res.json({
            success: true,
            count: result.rows.length,
            listings: result.rows
        })
    } catch (error) {
        console.error('Error fetching listings:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch listings'
        })
    }
})


// Add a new marketplace listing
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            item_name,
            description,
            category,
            listing_type,
            condition,
            price,
            security_deposit,
            pickup_location,
            image_url
        } = req.body

        const owner_id = req.user.user_id

        if (!owner_id || !item_name || !category || !listing_type) {
            return res.status(400).json({
                success: false,
                message: 'Owner, item name, category and listing type are required'
            })
        }

        if (!['rent', 'sell', 'swap', 'giveaway'].includes(listing_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing type'
            })
        }

        const result = await pool.query(
            `INSERT INTO listings (
                owner_id,
                item_name,
                description,
                category,
                listing_type,
                condition,
                price,
                security_deposit,
                pickup_location,
                image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                owner_id,
                item_name,
                description || null,
                category,
                listing_type,
                condition || null,
                price ?? 0,
                security_deposit ?? 0,
                pickup_location || null,
                image_url || null
            ]
        )

        res.status(201).json({
            success: true,
            message: 'Listing created successfully!',
            listing: result.rows[0]
        })

    } catch (error) {
        console.error('Error creating listing:', error)

        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'The specified owner does not exist'
            })
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create listing'
        })
    }
})


// Get a single listing by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID'
            })
        }

        const result = await pool.query(
            `SELECT
                l.*,
                u.full_name AS owner_name
             FROM listings l
             JOIN users u ON l.owner_id = u.user_id
             WHERE l.listing_id = $1`,
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            })
        }

        res.json({
            success: true,
            listing: result.rows[0]
        })

    } catch (error) {
        console.error('Error fetching listing:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch listing'
        })
    }
})


 // Update a marketplace listing
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID'
            })
        }

        const {
            item_name,
            description,
            category,
            listing_type,
            condition,
            price,
            security_deposit,
            pickup_location,
            image_url,
            is_available
        } = req.body

        const result = await pool.query(
            `UPDATE listings
             SET
                item_name = COALESCE($1, item_name),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                listing_type = COALESCE($4, listing_type),
                condition = COALESCE($5, condition),
                price = COALESCE($6, price),
                security_deposit = COALESCE($7, security_deposit),
                pickup_location = COALESCE($8, pickup_location),
                image_url = COALESCE($9, image_url),
                is_available = COALESCE($10, is_available)
             WHERE listing_id = $11
             AND owner_id = $12
             RETURNING *`,
            [
                item_name ?? null,
                description ?? null,
                category ?? null,
                listing_type ?? null,
                condition ?? null,
                price ?? null,
                security_deposit ?? null,
                pickup_location ?? null,
                image_url ?? null,
                is_available ?? null,
                id,
                req.user.user_id
            ]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            })
        }

        res.json({
            success: true,
            message: 'Listing updated successfully!',
            listing: result.rows[0]
        })

    } catch (error) {
        console.error('Error updating listing:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to update listing'
        })
    }
})


 // Deactivate a marketplace listing
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID'
            })
        }

        const result = await pool.query(
            `UPDATE listings
             SET is_available = FALSE
             WHERE listing_id = $1
             AND owner_id = $2
             RETURNING *`,
            [id, req.user.user_id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            })
        }

        res.json({
            success: true,
            message: 'Listing deactivated successfully!',
            listing: result.rows[0]
        })

    } catch (error) {
        console.error('Error deactivating listing:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to deactivate listing'
        })
    }
})

export default router
