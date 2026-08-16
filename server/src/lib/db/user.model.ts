import type { RegisteredUser } from '@prisma/client'
import { prisma } from './index.js'

export type CreateRegisteredUserInput = {
  email: string
  hashedOtp: string
  firstName: string
}

export const userModel = {
  findByEmail(email: string): Promise<RegisteredUser | null> {
    return prisma.registeredUser.findUnique({ where: { email } })
  },

  create(data: CreateRegisteredUserInput): Promise<RegisteredUser> {
    return prisma.registeredUser.create({ data })
  },
}

export type { RegisteredUser }
