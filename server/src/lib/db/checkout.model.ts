import type { CheckoutForm } from '@prisma/client'
import { prisma } from './index.js'

export type CreateCheckoutFormInput = {
  email: string
  phone: string
  address: string
}

export const checkoutModel = {
  create(data: CreateCheckoutFormInput): Promise<CheckoutForm> {
    return prisma.checkoutForm.create({ data })
  },
}

export type { CheckoutForm }
