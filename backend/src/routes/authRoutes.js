
import express from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'
import jwt from 'jsonwebtoken'
import authenticateToken from '../middleware/authMiddleware.js'

const router = express.Router()

// Student Signup
router.post('/signup', async (req, res) => {
    try {
        const {
            full_name,
            email,
            password,
            college_id,
            department
        } = req.body

        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            })
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters'
            })
        }

        const normalizedEmail = email.trim().toLowerCase()
        const password_hash = await bcrypt.hash(password, 12)

        const result = await pool.query(
            `INSERT INTO users (
                full_name,
                email,
                password_hash,
                college_id,
                department
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id, full_name, email,
                      college_id, department, role`,
            [
                full_name.trim(),
                normalizedEmail,
                password_hash,
                college_id || null,
                department || null
            ]
        )

        res.status(201).json({
            success: true,
            message: 'Student registered successfully!',
            user: result.rows[0]
        })

    } catch (error) {
        console.error('Signup error:', error)

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            })
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed'
        })
    }
})


// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            })
        }

        const normalizedEmail = email.trim().toLowerCase()

        const result = await pool.query(
            `SELECT user_id, full_name, email, password_hash,
                    college_id, department, role
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        const user = result.rows[0]

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        )

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                college_id: user.college_id,
                department: user.department,
                role: user.role
            }
        })

    } catch (error) {
        console.error('Login error:', error)

        res.status(500).json({
            success: false,
            message: 'Login failed'
        })
    }
})


// Get logged-in user's profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, full_name, email,
                    college_id, department, role
             FROM users
             WHERE user_id = $1`,
            [req.user.user_id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        res.json({
            success: true,
            user: result.rows[0]
        })

    } catch (error) {
        console.error('Profile error:', error)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        })
    }
})

export default router
