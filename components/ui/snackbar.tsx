'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SnackbarProps {
  message: string
  open: boolean
  onClose: () => void
  duration?: number
  className?: string
}

export function Snackbar({ message, open, onClose, duration = 3000, className }: SnackbarProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for fade out animation
      }, duration)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [open, duration, onClose])

  if (!open && !isVisible) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
        'bg-card border border-border rounded-lg shadow-lg',
        'px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-[500px]',
        'transition-all duration-300 ease-in-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
    >
      <p className="flex-1 text-sm text-foreground">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
