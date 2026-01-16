'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskSchema, type TaskInput } from '@/lib/validations'

interface NewTaskFormProps {
  clientId: string
  projectId?: string // If provided, project is pre-selected and field is hidden
  projects: Array<{ id: string; name: string }>
  contentTypes: Array<{ id: string; name: string }>
  platforms: Array<{ id: string; name: string }>
  durations: Array<{ id: string; label: string; seconds: number }>
  dimensions: Array<{ id: string; label: string; value: string }>
  onSuccess?: () => void
  onCancel?: () => void
}

export function NewTaskForm({ 
  clientId,
  projectId,
  projects, 
  contentTypes, 
  platforms, 
  durations, 
  dimensions,
  onSuccess,
  onCancel
}: NewTaskFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'drafts',
    },
  })

  const onSubmit = async (data: TaskInput) => {
    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await (supabase
        .from('tasks') as any)
        .insert({
          client_id: clientId,
          project_id: projectId || data.project_id,
          title: data.title,
          content_type: data.content_type,
          platform: data.platform,
          duration_seconds: data.duration_seconds || null,
          dimensions: data.dimensions || null,
          brief: data.brief,
          status: data.status || 'drafts',
        })

      if (insertError) throw insertError

      reset()
      router.refresh()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
      {!projectId ? (
        <div className="space-y-2">
          <Label htmlFor="project_id">Project *</Label>
          <Controller
            name="project_id"
            control={control}
            rules={{ required: 'Please select a project' }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={errors.project_id ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.project_id && (
            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{errors.project_id.message}</p>
          )}
        </div>
      ) : (
        <div className="rounded-md bg-muted/50 p-3 border border-border">
          <Label className="text-xs sm:text-sm text-muted-foreground">Project</Label>
          <p className="text-sm sm:text-base font-medium text-foreground mt-1">{projects[0]?.name}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">Task Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Create Instagram post for product launch"
          className={`h-10 sm:h-11 ${errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {errors.title && (
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{errors.title.message}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="content_type" className="text-sm font-medium">Content Type *</Label>
          <Controller
            name="content_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={`w-full ${errors.content_type ? 'border-red-500 focus-visible:ring-red-500' : ''}`}>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.content_type && (
            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{errors.content_type.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform" className="text-sm font-medium">Platform *</Label>
          <Controller
            name="platform"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={`w-full ${errors.platform ? 'border-red-500 focus-visible:ring-red-500' : ''}`}>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.name}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.platform && (
            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{errors.platform.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_seconds" className="text-sm font-medium">Duration</Label>
          <Controller
            name="duration_seconds"
            control={control}
            render={({ field }) => (
              <Select 
                onValueChange={(value) => field.onChange(value === 'none' ? null : parseInt(value))} 
                value={field.value?.toString() || 'none'}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {durations.map((duration) => (
                    <SelectItem key={duration.id} value={duration.seconds.toString()}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensions" className="text-sm font-medium">Dimensions</Label>
          <Controller
            name="dimensions"
            control={control}
            render={({ field }) => (
              <Select 
                onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                value={field.value || 'none'}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select dimensions (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {dimensions.map((dimension) => (
                    <SelectItem key={dimension.id} value={dimension.value}>
                      {dimension.label} ({dimension.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="brief" className="text-sm font-medium">Brief *</Label>
        <Textarea
          id="brief"
          {...register('brief')}
          placeholder="Describe what you need..."
          rows={5}
          className={`min-h-[120px] resize-y ${errors.brief ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {errors.brief && (
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{errors.brief.message}</p>
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
          {loading ? 'Creating...' : 'Create Task'}
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
