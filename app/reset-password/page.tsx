'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useTheme } from '@/components/theme/ThemeProvider'
import { Key, Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check if user has verified the reset code (code-only flow, no magic links)
    const checkVerification = async () => {
      const resetVerified = sessionStorage.getItem('reset_verified')
      
      // Also check if there's an active session (user might have verified already)
      const { data: { session } } = await supabase.auth.getSession()

      if (resetVerified === 'true' || session) {
        // User came from confirmation page with verified code
        setIsVerified(true)
      } else {
        // No valid verification, redirect to confirmation
        router.push('/reset-password/confirm')
      }
    }

    checkVerification()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Code should already be verified from the confirm page
      // Just update the password with the active session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      // Clear session storage
      sessionStorage.removeItem('reset_verified')

      setSuccess(true)
      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/login?message=Password reset successfully. Please sign in with your new password.')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
      setLoading(false)
    }
  }

  if (!isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Verifying reset token...</p>
        </div>
      </div>
    )
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
              <CardTitle className="text-3xl font-bold tracking-tight">Password Reset!</CardTitle>
              <CardDescription className="text-base">
                Your password has been successfully reset. Redirecting to login...
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
              Enter your new password
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
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
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
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
