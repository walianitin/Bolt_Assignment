import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { userModel } from '../lib/db/user.model.js'
import { sendOtpEmail } from '../lib/mail.js'
import { compareOtp, generateOtp, hashOtp, maskEmail } from '../lib/otp.js'
import {
  isValidEmail,
  isValidName,
  isValidOtp,
  normalizeEmail,
} from '../lib/validation.js'
import { createTokenBucketLimiter } from '../middleware/rateLimit.js'

export const authRouter = Router()

const authRateLimit = createTokenBucketLimiter({
  capacity: Number(process.env.AUTH_RATE_LIMIT_CAPACITY) || 5,
  refillPerSecond: Number(process.env.AUTH_RATE_LIMIT_REFILL_PER_SEC) || 1 / 60,
})

authRouter.post('/register', authRateLimit, async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body ?? {}

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Valid email is required' })
      return
    }
    if (!isValidName(firstName)) {
      res.status(400).json({ error: 'firstName is required' })
      return
    }
    if (lastName !== undefined && !isValidName(lastName)) {
      res.status(400).json({ error: 'lastName is invalid' })
      return
    }

    const normalizedEmail = normalizeEmail(email)
    const existing = await userModel.findByEmail(normalizedEmail)
    if (existing) {
      res.status(409).json({ error: 'Email is already registered' })
      return
    }

    const otp = generateOtp()
    const hashedOtp = await hashOtp(otp)

    const user = await userModel.create({
      email: normalizedEmail,
      hashedOtp,
      firstName: firstName.trim(),
    })

    await sendOtpEmail(normalizedEmail, otp)

    res.status(201).json({
      success: true,
      message: 'Registered successfully. OTP sent to email.',
      email: maskEmail(normalizedEmail),
      userId: user.id,
      otp,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Email or OTP hash already exists' })
      return
    }
    console.error('[register]', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

authRouter.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body ?? {}

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Valid email is required' })
      return
    }

    const user = await userModel.findByEmail(normalizeEmail(email))
    res.json({ registered: Boolean(user) })
  } catch (error) {
    console.error('[verify-email]', error)
    res.status(500).json({ error: 'Email verification check failed' })
  }
})

authRouter.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, otp } = req.body ?? {}

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Valid email is required' })
      return
    }
    if (!isValidOtp(otp)) {
      res.status(400).json({ error: 'OTP must be a 6-digit code' })
      return
    }

    const user = await userModel.findByEmail(normalizeEmail(email))
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or OTP' })
      return
    }

    const ok = await compareOtp(otp.trim(), user.hashedOtp)
    if (!ok) {
      res.status(401).json({ success: false, error: 'Invalid email or OTP' })
      return
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      },
    })
  } catch (error) {
    console.error('[login]', error)
    res.status(500).json({ error: 'Login failed' })
  }
})
