
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'

// Verify login token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please login first.'
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()

    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        })
    }
}


// Verify admin role directly from database
export const authorizeAdmin = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT role FROM users WHERE user_id = $1`,
            [req.user.user_id]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User account not found'
            })
        }

        if (result.rows[0].role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            })
        }

        next()

    } catch (error) {
        console.error('Admin authorization error:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to verify admin access'
        })
    }
}

export default authenticateToken
