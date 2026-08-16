import { toast } from 'sonner'

const apiUrl = import.meta.env.VITE_API_URL || '/api'

type RequestOptions = RequestInit & {
  /** Skip success toast (e.g. background verify-email) */
  silent?: boolean
  successMessage?: string
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const { silent, successMessage, ...fetchInit } = init ?? {}

  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(fetchInit.headers ?? {}),
    },
    ...fetchInit,
  })

  let body: unknown = null
  const text = await response.text()
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = null
    }
  }

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : response.statusText || 'Request failed'

    if (!silent) {
      toast.error(`Status ${response.status}`, {
        description: message,
      })
    }

    throw new Error(message)
  }

  if (!silent) {
    const description =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
        ? (body as { message: string }).message
        : successMessage

    toast.success(`Status ${response.status}`, {
      description: description || 'Request successful',
    })
  }

  return body as T
}

export type RegisterResponse = {
  success: boolean
  message: string
  email: string
  userId: string
  otp: string
}

export type VerifyEmailResponse = {
  registered: boolean
}

export type LoginResponse = {
  success: boolean
  message: string
  user: {
    id: string
    email: string
    firstName: string | null
  }
}

export type CheckoutResponse = {
  success: boolean
  data: {
    id: string
    email: string
    phone: string
    address: string
    createdAt: string
  }
}

export function registerUser(input: {
  email: string
  firstName: string
  lastName: string
}) {
  return request<RegisterResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(input),
    successMessage: 'Registered successfully',
  })
}

export function verifyEmail(email: string) {
  return request<VerifyEmailResponse>('/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
    silent: true,
  })
}

export function loginUser(input: { email: string; otp: string }) {
  return request<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(input),
    successMessage: 'Login successful',
  })
}

export function submitCheckout(input: {
  email: string
  phone: string
  address: string
}) {
  return request<CheckoutResponse>('/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
    successMessage: 'Checkout saved',
  })
}
