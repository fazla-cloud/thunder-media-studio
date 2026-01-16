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
import { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  initialTask?: Task
}

interface TaskUpdate {
  status: 'drafts' | 'in_progress' | 'completed' | 'archived'
  assigned_to: string | null
}

export function EditTaskDialog({ open, onOpenChange, taskId, initialTask }: EditTaskDialogProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [task, setTask] = useState<Task | null>(initialTask || null)
  const [designers, setDesigners] = useState<Profile[]>([])
  const [marketers, setMarketers] = useState<Profile[]>([])
  const supabase = createClient()

  // Fetch task and users
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        // Fetch task if not provided
        if (!task) {
          const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single()

          if (taskData) {
            setTask(taskData as Task)
          }
        }

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
      }
      fetchData()
    }
  }, [open, taskId, supabase, task])

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskUpdate>({
    defaultValues: {
      status: task?.status || 'drafts',
      assigned_to: task?.assigned_to || null,
    },
  })

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      reset({
        status: task.status as 'drafts' | 'in_progress' | 'completed' | 'archived',
        assigned_to: task.assigned_to || null,
      })
    }
  }, [task, reset])

  const onSubmit = async (data: TaskUpdate) => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await (supabase
        .from('tasks') as any)
        .update({
          status: data.status,
          assigned_to: data.assigned_to || null,
        })
        .eq('id', taskId)

      if (updateError) throw updateError

      reset()
      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setError(null)
    onOpenChange(false)
  }

  if (!task) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            Loading task...
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task status and assignment
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Task</Label>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium text-foreground">{task.title}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drafts">Drafts</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Controller
              name="assigned_to"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                  value={field.value || 'none'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user or leave unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
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
              {loading ? 'Updating...' : 'Update Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
