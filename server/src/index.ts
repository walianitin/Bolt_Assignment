import './loadEnv.js'

import cors from 'cors'
import express from 'express'
import { authRouter } from './routes/auth.js'
import { checkoutRouter } from './routes/checkout.js'

const app = express()
const port = Number(process.env.PORT) || 5000

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (Postman, curl) with no Origin header
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: process.env.APP_NAME || 'BoltAssignment',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api', authRouter)
app.use('/api/checkout', checkoutRouter)

app.listen(port, () => {
  console.log(`${process.env.APP_NAME || 'BoltAssignment'} API listening on http://localhost:${port}`)
})
