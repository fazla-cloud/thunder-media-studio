'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'

interface EditableProjectNameProps {
  projectId: string
  initialName: string
  className?: string
}

export function EditableProjectName({ projectId, initialName, className }: EditableProjectNameProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Project name cannot be empty')
      return
    }

    if (name.trim() === initialName) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const updateData: Database['public']['Tables']['projects']['Update'] = { name: name.trim() }
      const { error: updateError } = await (supabase
        .from('projects') as any)
        .update(updateData)
        .eq('id', projectId)

      if (updateError) throw updateError

      setIsEditing(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update project name')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setName(initialName)
    setError(null)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave()
            } else if (e.key === 'Escape') {
              handleCancel()
            }
          }}
          className={`flex-1 ${className}`}
          autoFocus
          disabled={loading}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
        {error && (
          <span className="text-xs text-destructive ml-2">{error}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className={`${className} flex-1`}>{name}</h1>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit project name"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  )
}
