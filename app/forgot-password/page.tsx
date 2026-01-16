'use client'

import { useState } from 'react'
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
import { Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      // Code-only flow, no redirectTo needed
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) throw error

      // Redirect to confirmation page with email
      const encodedEmail = encodeURIComponent(email)
      router.push(`/reset-password/confirm?email=${encodedEmail}&message=Please check your email for a reset code.`)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
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
            <CardTitle className="text-3xl font-bold tracking-tight">Forgot Password?</CardTitle>
            <CardDescription className="text-base">
              Enter your email and we'll send you a reset code
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
              {loading ? 'Sending...' : 'Send Reset Code'}
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
