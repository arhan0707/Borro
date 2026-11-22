
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './config/db.js'

import listingRoutes from './routes/listingRoutes.js'
import rentalRoutes from './routes/rentalRoutes.js'
import lostFoundRoutes from './routes/lostFoundRoutes.js'
import connectRoutes from './routes/connectRoutes.js'
import campusRoutes from './routes/campusRoutes.js'
import authRoutes from './routes/authRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/listings', listingRoutes)
app.use('/api/rentals', rentalRoutes)
app.use('/api/lost-found', lostFoundRoutes)
app.use('/api/projects', connectRoutes)
app.use('/api/events', campusRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)

// Welcome route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Borro API!',
        status: 'Server is running successfully'
    })
})

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Borro backend is healthy!'
    })
})

// Database test
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()')

        res.json({
            success: true,
            message: 'Borro database connected successfully!',
            database_time: result.rows[0].now
        })

    } catch (error) {
        console.error('Database connection error:', error)

        res.status(500).json({
            success: false,
            message: 'Database connection failed!'
        })
    }
})

app.listen(PORT, () => {
    console.log(`Borro server running at http://localhost:${PORT}`)
})
