'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Controller, useForm } from 'react-hook-form'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface AssignTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  projectId: string
}

interface AssignFormData {
  assigned_to: string
}

export function AssignTaskDialog({ open, onOpenChange, taskId, projectId }: AssignTaskDialogProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [designers, setDesigners] = useState<Profile[]>([])
  const [marketers, setMarketers] = useState<Profile[]>([])
  const [taskTitle, setTaskTitle] = useState<string>('')
  const supabase = createClient()

  // Fetch designers and marketers, and task details
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        // Fetch users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['designer', 'marketer'])
          .eq('is_active', true)
          .order('full_name')

        if (profiles) {
          const typedProfiles = profiles as Database['public']['Tables']['profiles']['Row'][]
          setDesigners(typedProfiles.filter(p => p.role === 'designer'))
          setMarketers(typedProfiles.filter(p => p.role === 'marketer'))
        }

        // Fetch task title
        const { data: task } = await supabase
          .from('tasks')
          .select('title')
          .eq('id', taskId)
          .single()

        if (task) {
          const typedTask = task as Pick<Database['public']['Tables']['tasks']['Row'], 'title'>
          setTaskTitle(typedTask.title)
        }
      }
      fetchData()
    }
  }, [open, supabase, taskId])

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssignFormData>()

  const onSubmit = async (data: AssignFormData) => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await (supabase
        .from('tasks') as any)
        .update({
          assigned_to: data.assigned_to,
          status: 'in_progress', // Auto-set to in_progress when assigned
        })
        .eq('id', taskId)

      if (updateError) throw updateError

      reset()
      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to assign task')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Assign this task to a designer or marketer
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Task</Label>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium text-foreground">{taskTitle || 'Loading...'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To</Label>
            <Controller
              name="assigned_to"
              control={control}
              rules={{ required: 'Please select a user' }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select designer or marketer" />
                  </SelectTrigger>
                  <SelectContent>
                    {designers.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Designers
                        </div>
                        {designers.map((designer) => (
                          <SelectItem key={designer.id} value={designer.id}>
                            {designer.full_name || 'Unnamed'} {designer.title ? `- ${designer.title}` : ''}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {marketers.length > 0 && (
                      <>
                        {designers.length > 0 && <div className="h-px bg-border my-1" />}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Marketers
                        </div>
                        {marketers.map((marketer) => (
                          <SelectItem key={marketer.id} value={marketer.id}>
                            {marketer.full_name || 'Unnamed'} {marketer.title ? `- ${marketer.title}` : ''}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {designers.length === 0 && marketers.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        No designers or marketers available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.assigned_to && (
              <p className="text-sm text-destructive">{errors.assigned_to.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
