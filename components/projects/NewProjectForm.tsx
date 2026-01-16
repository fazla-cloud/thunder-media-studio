'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, type ProjectInput } from '@/lib/validations'

interface NewProjectFormProps {
  clientId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function NewProjectForm({ clientId, onSuccess, onCancel }: NewProjectFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'active',
    },
  })

  const onSubmit = async (data: ProjectInput) => {
    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await (supabase
        .from('projects') as any)
        .insert({
          client_id: clientId,
          name: data.name,
          description: data.description || null,
          status: data.status || 'active',
        })

      if (insertError) throw insertError

      reset()
      router.refresh()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">Project Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="My Marketing Campaign"
          className={`h-10 sm:h-11 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {errors.name && (
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe your project..."
          rows={4}
          className={`min-h-[100px] resize-y ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {errors.description && (
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{errors.description.message}</p>
        )}
      </div>
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-xs sm:text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-medium">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset()
            onCancel?.()
          }}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
