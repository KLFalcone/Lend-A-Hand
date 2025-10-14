/**
 * NOTE: Do NOT add routes here.
 * Only change global middleware. New endpoints live in src/routes/*.routes.js
 */


import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import routes from './routes/index.js'
import notFound from './middleware/notFound.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

// Parse
app.use(express.json())
app.use(cookieParser())

// CORS using CLIENT_URL and cookies
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}))

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Health quick check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' })
})

// Versioned API router
app.use('/api/v1', routes)

// 404 + error handler
app.use(notFound)
app.use(errorHandler)

export default app
