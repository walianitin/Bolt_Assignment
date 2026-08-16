import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { checkoutModel } from '../lib/db/checkout.model.js'
import {
  isValidAddress,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
} from '../lib/validation.js'

export const checkoutRouter = Router()

checkoutRouter.post('/', async (req, res) => {
  try {
    const { email, phone, address } = req.body ?? {}

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Valid email is required' })
      return
    }
    if (!isValidPhone(phone)) {
      res.status(400).json({ error: 'Valid phone is required' })
      return
    }
    if (!isValidAddress(address)) {
      res.status(400).json({ error: 'Valid address is required' })
      return
    }

    const record = await checkoutModel.create({
      email: normalizeEmail(email),
      phone: phone.trim(),
      address: address.trim(),
    })

    res.status(201).json({
      success: true,
      data: {
        id: record.id,
        email: record.email,
        phone: record.phone,
        address: record.address,
        createdAt: record.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({
        error:
          'A checkout with this email and phone number already exists. Please use a different email or phone.',
      })
      return
    }
    console.error('[checkout]', error)
    res.status(500).json({ error: 'Checkout failed' })
  }
})
