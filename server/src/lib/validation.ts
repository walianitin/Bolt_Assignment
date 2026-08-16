const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_RE = /^\d{6}$/
const PHONE_RE = /^[+]?[\d\s().-]{7,20}$/

export function isNonEmptyString(value: unknown, min = 1, max = 200): value is string {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}

export function isValidOtp(value: unknown): value is string {
  return typeof value === 'string' && OTP_RE.test(value.trim())
}

export function isValidPhone(value: unknown): value is string {
  return typeof value === 'string' && PHONE_RE.test(value.trim())
}

export function isValidAddress(value: unknown): value is string {
  return isNonEmptyString(value, 5, 500)
}

export function isValidName(value: unknown): value is string {
  return isNonEmptyString(value, 1, 100)
}
