import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormField } from '@/components/FormField'
import { registerUser } from '@/lib/api'
import { isValidEmail } from '@/lib/validation'

type RegisterForm = {
  email: string
  firstName: string
  lastName: string
}

export function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    email: '',
    firstName: '',
    lastName: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otpOnce, setOtpOnce] = useState<string | null>(null)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!isValidEmail(form.email)) {
      setError('Enter a valid email address')
      return
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required')
      return
    }

    setSubmitting(true)
    try {
      const result = await registerUser({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      })
      setOtpOnce(result.otp)
      setMaskedEmail(result.email)
      setForm({ email: '', firstName: '', lastName: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (otpOnce) {
    return (
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Save this code</CardTitle>
            <CardDescription>
              You&apos;ll need it to log in. It is shown once and cannot be
              retrieved again from this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted px-4 py-6 text-center">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                One-time code
              </p>
              <p className="font-mono text-3xl font-semibold tracking-[0.35em] text-foreground">
                {otpOnce}
              </p>
            </div>
            {maskedEmail ? (
              <p className="text-sm text-muted-foreground">
                Sent for {maskedEmail}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  void navigator.clipboard?.writeText(otpOnce)
                }}
              >
                Copy code
              </Button>
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link to="/checkout">Go to checkout</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register to get a one-time login code.
        </p>
      </div>

      <Card>
        <CardContent className="pt-(--card-spacing)">
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField id="email" label="Email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </FormField>

            <FormField id="firstName" label="First name">
              <Input
                id="firstName"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, firstName: e.target.value }))
                }
                required
              />
            </FormField>

            <FormField id="lastName" label="Last name">
              <Input
                id="lastName"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, lastName: e.target.value }))
                }
                required
              />
            </FormField>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Registering…' : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
