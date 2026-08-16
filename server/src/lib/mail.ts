import nodemailer from 'nodemailer'

const appName = () => process.env.APP_NAME || 'BoltAssignment'

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || `${appName()} <noreply@localhost>`
  const subject = `${appName()} verification code`
  const text = `Your verification code is ${otp}. It is shown once and is not stored in plaintext.`

  const transport = createTransport()

  if (!transport) {
    console.info(`[email:dev] To: ${to} | OTP: ${otp}`)
    return
  }

  await transport.sendMail({ from, to, subject, text })
}
