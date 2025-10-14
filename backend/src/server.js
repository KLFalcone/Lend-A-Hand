/**
 * NOTE: Do NOT add routes here.
 * Only change global middleware. New endpoints live in src/routes/*.routes.js
 */

import 'dotenv/config'
import app from './app.js'
import connectDb from './db.js'

const port = Number(process.env.PORT) || 5000
const host = '0.0.0.0' // bind to all interfaces (works with localhost/127.0.0.1)

async function start() {
  try {
    await connectDb()

    const server = app.listen(port, host, () => {
      const addr = server.address()
      console.log(`API listening on ${addr.address}:${addr.port}`)
    })

    // optional: graceful shutdown
    const close = () => server.close(() => process.exit(0))
    process.on('SIGINT', close)
    process.on('SIGTERM', close)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
