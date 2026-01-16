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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useTheme } from '@/components/theme/ThemeProvider'
import { Snackbar } from '@/components/ui/snackbar'
import { Mail, Key } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [comingSoon, setComingSoon] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error
      if (!authData?.user) throw new Error('No user returned from sign in')

      // Get user profile to determine redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      // Use role-based routing
      const role = (profile as { role: string } | null)?.role as 'client' | 'admin' | 'designer' | 'marketer' | undefined
      const redirectPath = role === 'admin' 
        ? '/dashboard/admin' 
        : role === 'designer'
        ? '/dashboard/designer'
        : role === 'marketer'
        ? '/dashboard/marketer'
        : '/dashboard/client'
      
      // Force a full page navigation to ensure cookies are included
      // The createBrowserClient automatically sets cookies, and window.location
      // will include them in the next request
      window.location.href = redirectPath
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    setComingSoon(true)
    setError(null)
    // Hide the message after 3 seconds
    setTimeout(() => {
      setComingSoon(false)
    }, 3000)
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
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back!</CardTitle>
            <CardDescription className="text-base">
              Sign in to access your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-card hover:bg-muted border-border h-11 text-foreground"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  className="pl-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="******"
                  className="pl-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
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
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/signup" className="text-foreground hover:underline font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
      <Snackbar
        message="Coming soon! Google sign-in will be available shortly."
        open={comingSoon}
        onClose={() => setComingSoon(false)}
        duration={3000}
      />
    </div>
  )
}
