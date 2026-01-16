'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useTheme } from '@/components/theme/ThemeProvider'
import { Mail } from 'lucide-react'

export default function ResetPasswordConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const supabase = createClient()

  // Get message, email, and error from URL params
  useEffect(() => {
    const urlMessage = searchParams.get('message')
    if (urlMessage) {
      setMessage(urlMessage)
    }
    const urlEmail = searchParams.get('email')
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail))
    }
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
    }
  }, [searchParams])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])


  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(0, 1)
    
    if (digit) {
      const newCode = [...code]
      newCode[index] = digit
      setCode(newCode)
      setError(null)

      // Auto-focus next input
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus()
      }
    } else {
      const newCode = [...code]
      newCode[index] = ''
      setCode(newCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    
    for (let i = 0; i < 6; i++) {
      newCode[i] = pastedData[i] || ''
    }
    
    setCode(newCode)
    
    // Focus the last filled input or the first empty one
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleCodeConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const verifyOptions: any = {
        token: fullCode,
        type: 'recovery',
      }
      
      // Include email if provided for better verification
      if (email) {
        verifyOptions.email = email
      }

      const { error: verifyError } = await supabase.auth.verifyOtp(verifyOptions)

      if (verifyError) throw verifyError

      // Code verified successfully - session is now active
      // Store a flag to indicate verification was successful
      sessionStorage.setItem('reset_verified', 'true')
      setSuccess(true)
      // Redirect to reset password page after successful verification
      setTimeout(() => {
        router.push('/reset-password')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Invalid reset code')
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError('Email address is required')
      return
    }

    if (resendCountdown > 0) return

    setResendLoading(true)
    setError(null)

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'recovery',
        email: email,
      })

      if (resendError) throw resendError

      setResendCountdown(60) // 60 second countdown
      setMessage('A new reset code has been sent to your email.')
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md shadow-lg dark:shadow-xl border-border">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <Image
                  src={theme === 'dark' ? '/thunder-logo-white.svg' : '/thunder-logo.svg'}
                  alt="Thunder Logo"
                  width={64}
                  height={64}
                  priority
                />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold tracking-tight">Code Verified!</CardTitle>
              <CardDescription className="text-base">
                Redirecting to reset your password...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg dark:shadow-xl border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Image
                src={theme === 'dark' ? '/thunder-logo-white.svg' : '/thunder-logo.svg'}
                alt="Thunder Logo"
                width={64}
                height={64}
                priority
              />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">Reset Password</CardTitle>
            <CardDescription className="text-base">
              Enter the reset code from your email
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <div className="mb-4 rounded-md bg-primary/10 dark:bg-primary/20 p-3 text-sm text-primary dark:text-primary-foreground border border-primary/20">
              {message}
            </div>
          )}
          <form onSubmit={handleCodeConfirmation} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  readOnly
                  className="pl-10 h-11 bg-muted/50 border-border text-muted-foreground cursor-not-allowed opacity-70"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Reset Code</Label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-semibold bg-card border-2 transition-all ${
                      digit
                        ? 'border-primary dark:border-primary text-foreground'
                        : 'border-border text-muted-foreground focus:border-primary dark:focus:border-primary'
                    } rounded-lg focus:ring-2 focus:ring-primary/20`}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              disabled={loading || code.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Didn't receive a code? </span>
            {resendCountdown > 0 ? (
              <span className="text-muted-foreground">Resend ({resendCountdown})</span>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading || !email}
                className="text-foreground hover:underline font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : 'Resend'}
              </button>
            )}
          </div>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-foreground hover:underline font-medium transition-colors">
              Back to Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
