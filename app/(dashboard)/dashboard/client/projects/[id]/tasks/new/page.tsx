import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NewTaskForm } from '@/components/tasks/NewTaskForm'
import { Database } from '@/types/database'

export default async function NewProjectTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await requireRole('client')
  const { id: projectId } = await params
  const supabase = await createClient()

  // Verify project belongs to user
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .eq('client_id', profile.id)
    .single()

  if (!project) {
    redirect('/dashboard/client/projects')
  }

  // Type the project explicitly
  const typedProject = project as Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'name'>

  // Get all options for selects
  const { data: contentTypes } = await supabase
    .from('content_types')
    .select('id, name')
    .order('name')

  const { data: platforms } = await supabase
    .from('platforms')
    .select('id, name')
    .order('name')

  const { data: durations } = await supabase
    .from('durations')
    .select('id, label, seconds')
    .order('seconds')

  const { data: dimensions } = await supabase
    .from('dimensions')
    .select('id, label, value')
    .order('label')

  // Type all the options explicitly
  const typedContentTypes = (contentTypes || []) as Database['public']['Tables']['content_types']['Row'][]
  const typedPlatforms = (platforms || []) as Database['public']['Tables']['platforms']['Row'][]
  const typedDurations = (durations || []) as Database['public']['Tables']['durations']['Row'][]
  const typedDimensions = (dimensions || []) as Database['public']['Tables']['dimensions']['Row'][]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">New Task</h1>
        <p className="text-muted-foreground mt-2">Create a new task for project: {typedProject.name}</p>
      </div>
      <NewTaskForm 
        clientId={profile.id}
        projectId={projectId}
        projects={[typedProject]}
        contentTypes={typedContentTypes}
        platforms={typedPlatforms}
        durations={typedDurations}
        dimensions={typedDimensions}
      />
    </div>
  )
}
