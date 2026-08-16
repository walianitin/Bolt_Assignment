import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormField } from '@/components/FormField'
import { Modal } from '@/components/Modal'
import { loginUser, submitCheckout, verifyEmail } from '@/lib/api'
import { isValidEmail } from '@/lib/validation'

type CheckoutFormState = {
  email: string
  phone: string
  address: string
}

type LoggedInUser = {
  id: string
  email: string
  firstName: string | null
}

type VerifyEmailStatus = 'idle' | 'loading' | 'matched' | 'no-match'

const VERIFY_DEBOUNCE_MS = 450

export function CheckoutPage() {
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>({
    email: '',
    phone: '',
    address: '',
  })
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null)
  const [verifyStatus, setVerifyStatus] = useState<VerifyEmailStatus>('idle')
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpSubmitting, setOtpSubmitting] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const emailValid = isValidEmail(checkoutForm.email)
  const verifyRequestId = useRef(0)
  const loggedInUserRef = useRef(loggedInUser)
  loggedInUserRef.current = loggedInUser

  useEffect(() => {
    if (!emailValid) {
      setVerifyStatus('idle')
      return
    }

    const normalized = checkoutForm.email.trim().toLowerCase()
    const requestId = ++verifyRequestId.current
    setVerifyStatus('loading')

    const timer = window.setTimeout(async () => {
      try {
        const result = await verifyEmail(normalized)
        if (requestId !== verifyRequestId.current) return

        if (result.registered) {
          setVerifyStatus('matched')
          const alreadySignedIn =
            loggedInUserRef.current?.email.toLowerCase() === normalized
          // Show OTP modal on every successful verify-email match
          if (!alreadySignedIn) {
            setOtp('')
            setOtpError(null)
            setOtpModalOpen(true)
          }
        } else {
          setVerifyStatus('no-match')
        }
      } catch {
        if (requestId !== verifyRequestId.current) return
        setVerifyStatus('idle')
      }
    }, VERIFY_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [checkoutForm.email, emailValid])

  function updateField<K extends keyof CheckoutFormState>(
    key: K,
    value: CheckoutFormState[K],
  ) {
    setCheckoutForm((prev) => ({ ...prev, [key]: value }))
    setFormSuccess(null)
  }

  async function onVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOtpError(null)

    if (!/^\d{6}$/.test(otp.trim())) {
      setOtpError('Enter the 6-digit code')
      return
    }

    setOtpSubmitting(true)
    try {
      const result = await loginUser({
        email: checkoutForm.email.trim(),
        otp: otp.trim(),
      })
      setLoggedInUser(result.user)
      setOtpModalOpen(false)
      setOtp('')
      setOtpError(null)
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Invalid email or OTP')
    } finally {
      setOtpSubmitting(false)
    }
  }

  function onSkipOtp() {
    setOtpModalOpen(false)
    setOtp('')
    setOtpError(null)
  }

  async function onSubmitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!emailValid) {
      setFormError('Enter a valid email address')
      return
    }
    if (verifyStatus !== 'matched') {
      setFormError('Use a registered email to place an order')
      return
    }
    if (!checkoutForm.phone.trim()) {
      setFormError('Phone is required')
      return
    }
    if (checkoutForm.address.trim().length < 5) {
      setFormError('Enter a full shipping address')
      return
    }

    setSubmitting(true)
    try {
      await submitCheckout({
        email: checkoutForm.email.trim(),
        phone: checkoutForm.phone.trim(),
        address: checkoutForm.address.trim(),
      })
      setFormSuccess('Checkout saved successfully.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter shipping details. Registered emails will be asked for an OTP.
        </p>
      </div>

      {loggedInUser ? (
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          <span className="text-muted-foreground">Signed in as </span>
          <span className="font-medium text-foreground">
            {loggedInUser.firstName?.trim() || loggedInUser.email}
          </span>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Shipping</CardTitle>
          <CardDescription>
            Email is checked in the background while you continue filling the
            form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmitCheckout}>
            <FormField
              id="checkout-email"
              label="Email"
              error={
                emailTouched && checkoutForm.email && !emailValid
                  ? 'Enter a valid email'
                  : undefined
              }
              hint={
                !emailTouched || !emailValid
                  ? undefined
                  : verifyStatus === 'loading'
                    ? 'Checking email…'
                    : verifyStatus === 'matched'
                      ? 'Registered email found'
                      : verifyStatus === 'no-match'
                        ? 'Email not registered — place order stays disabled'
                        : undefined
              }
            >
              <Input
                id="checkout-email"
                type="email"
                autoComplete="email"
                value={checkoutForm.email}
                onChange={(e) => updateField('email', e.target.value)}
                onBlur={() => setEmailTouched(true)}
                aria-invalid={emailTouched && !!checkoutForm.email && !emailValid}
                required
              />
            </FormField>

            <FormField id="checkout-phone" label="Phone">
              <Input
                id="checkout-phone"
                type="tel"
                autoComplete="tel"
                value={checkoutForm.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                required
              />
            </FormField>

            <FormField id="checkout-address" label="Shipping address">
              <Textarea
                id="checkout-address"
                autoComplete="street-address"
                value={checkoutForm.address}
                onChange={(e) => updateField('address', e.target.value)}
                rows={4}
                required
              />
            </FormField>

            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            {formSuccess ? (
              <p className="text-sm text-foreground" role="status">
                {formSuccess}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || verifyStatus !== 'matched'}
            >
              {submitting ? 'Saving…' : 'Place order'}
            </Button>
            {verifyStatus !== 'matched' ? (
              <p className="text-center text-xs text-muted-foreground">
                Place order unlocks after a registered email is recognized.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Modal
        open={otpModalOpen}
        onOpenChange={(open) => {
          if (!open) onSkipOtp()
          else setOtpModalOpen(true)
        }}
        title="Enter your login code"
        description="This email is registered. Enter the 6-digit OTP, or skip to continue checkout."
        showCloseButton={false}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={onSkipOtp}>
              Skip
            </Button>
            <Button type="submit" form="otp-form" disabled={otpSubmitting}>
              {otpSubmitting ? 'Verifying…' : 'Verify OTP'}
            </Button>
          </>
        }
      >
        <form id="otp-form" className="space-y-3" onSubmit={onVerifyOtp}>
          <FormField
            id="otp"
            label="OTP"
            error={otpError ?? undefined}
          >
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              aria-invalid={!!otpError}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  )
}
