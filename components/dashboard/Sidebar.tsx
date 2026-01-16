'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  LogOut,
  Settings,
  Users,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/theme/ThemeProvider'

interface SidebarProps {
  role: 'client' | 'admin' | 'designer' | 'marketer'
}

const clientNavItems = [
  { href: '/dashboard/client', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/client/projects', label: 'Projects', icon: FolderKanban },
]

const designerNavItems = [
  { href: '/dashboard/designer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/designer/tasks', label: 'My Tasks', icon: CheckSquare },
]

const marketerNavItems = [
  { href: '/dashboard/marketer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/marketer/tasks', label: 'My Tasks', icon: CheckSquare },
]

const commonNavItems = [
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

const adminNavItems = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/projects', label: 'All Projects', icon: FolderKanban },
  { href: '/dashboard/admin/tasks', label: 'All Tasks', icon: CheckSquare },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const { theme } = useTheme()
  // Determine navigation items based on role
  let roleNavItems: typeof adminNavItems | typeof clientNavItems | typeof designerNavItems | typeof marketerNavItems = clientNavItems
  if (role === 'admin') {
    roleNavItems = adminNavItems
  } else if (role === 'client') {
    roleNavItems = clientNavItems
  } else if (role === 'designer') {
    roleNavItems = designerNavItems
  } else if (role === 'marketer') {
    roleNavItems = marketerNavItems
  }
  const navItems = [...roleNavItems, ...commonNavItems]

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      // Use window.location for full page navigation to ensure cookies are cleared
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      // Still redirect even if signOut fails
      window.location.href = '/login'
    }
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <Link href="/dashboard" className="flex h-16 items-center justify-center border-b border-sidebar-border px-4 hover:bg-sidebar-accent/10 transition-colors">
        <Image
          src={theme === 'dark' ? '/thunder-logo-transparent-white.svg' : '/thunder-logo-transparent.svg'}
          alt="Thunder Logo"
          width={200}
          height={64}
          className="w-full h-full object-contain"
          priority
        />
      </Link>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
