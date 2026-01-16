import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getDefaultRedirect } from '@/lib/routing'
import { getCurrentProfile } from '@/lib/auth'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  const supabase = await createClient()

  // Handle magic link confirmation (code parameter) - only for signup, not recovery
  // Recovery is code-only, no magic links
  if (code && type !== 'recovery') {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user profile to determine redirect
      const profile = await getCurrentProfile()
      const redirectPath = profile 
        ? getDefaultRedirect(profile.role)
        : '/dashboard/client'
      
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  if (token && type === 'signup') {
    // Try token_hash first (for email link tokens)
    let verifyError = null
    let verifyResult = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup',
    })
    verifyError = verifyResult.error

    // If that fails, try token directly
    if (verifyError) {
      verifyResult = await supabase.auth.verifyOtp({
        token: token,
        type: 'signup',
      })
      verifyError = verifyResult.error
    }
    
    if (!verifyError) {
      // Get user profile to determine redirect
      const profile = await getCurrentProfile()
      const redirectPath = profile 
        ? getDefaultRedirect(profile.role)
        : '/dashboard/client'
      
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
