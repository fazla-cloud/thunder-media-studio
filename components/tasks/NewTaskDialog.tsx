'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NewTaskForm } from './NewTaskForm'
import { Database } from '@/types/database'

interface NewTaskDialogProps {
  clientId: string
  projectId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewTaskDialog({ 
  clientId, 
  projectId,
  open, 
  onOpenChange 
}: NewTaskDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [contentTypes, setContentTypes] = useState<Array<{ id: string; name: string }>>([])
  const [platforms, setPlatforms] = useState<Array<{ id: string; name: string }>>([])
  const [durations, setDurations] = useState<Array<{ id: string; label: string; seconds: number }>>([])
  const [dimensions, setDimensions] = useState<Array<{ id: string; label: string; value: string }>>([])
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Get user's projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', clientId)
        .order('name')

      // Type projects explicitly
      const typedProjects = (projectsData || []) as Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'name'>[]

      // If projectId is provided, use that project
      const projectsList = projectId && typedProjects.length > 0
        ? typedProjects.filter(p => p.id === projectId)
        : typedProjects

      // Get all options for selects
      const [contentTypesRes, platformsRes, durationsRes, dimensionsRes] = await Promise.all([
        supabase.from('content_types').select('id, name').order('name'),
        supabase.from('platforms').select('id, name').order('name'),
        supabase.from('durations').select('id, label, seconds').order('seconds'),
        supabase.from('dimensions').select('id, label, value').order('label'),
      ])

      // Type all options explicitly
      const typedContentTypes = (contentTypesRes.data || []) as Database['public']['Tables']['content_types']['Row'][]
      const typedPlatforms = (platformsRes.data || []) as Database['public']['Tables']['platforms']['Row'][]
      const typedDurations = (durationsRes.data || []) as Database['public']['Tables']['durations']['Row'][]
      const typedDimensions = (dimensionsRes.data || []) as Database['public']['Tables']['dimensions']['Row'][]

      setProjects(projectsList)
      setContentTypes(typedContentTypes)
      setPlatforms(typedPlatforms)
      setDurations(typedDurations)
      setDimensions(typedDimensions)
    } catch (error) {
      console.error('Error loading form data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    onOpenChange(false)
    router.refresh()
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Loading...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  if (!projectId && (!projects || projects.length === 0)) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              You need to create a project first before creating tasks.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            {projectId 
              ? `Create a new task for this project`
              : 'Create a new task and select a project'
            }
          </DialogDescription>
        </DialogHeader>
        <NewTaskForm 
          clientId={clientId}
          projectId={projectId}
          projects={projects}
          contentTypes={contentTypes}
          platforms={platforms}
          durations={durations}
          dimensions={dimensions}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
