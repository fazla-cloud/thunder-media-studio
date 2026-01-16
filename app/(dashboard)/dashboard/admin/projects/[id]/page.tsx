import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { TaskListWithTabs } from '@/components/tasks/TaskListWithTabs'
import { StatusCard } from '@/components/tasks/StatusCard'
import { SearchFilter } from '@/components/common/SearchFilter'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { EditableProjectName } from '@/components/projects/EditableProjectName'
import Link from 'next/link'
import { ArrowLeft, FileEdit, PlayCircle, CheckCircle2, Archive } from 'lucide-react'
import { Database } from '@/types/database'

export default async function AdminProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ search?: string; dateFrom?: string; dateTo?: string }>
}) {
  const profile = await requireRole('admin')
  const { id } = await params
  const searchParamsData = await searchParams
  const supabase = await createClient()

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (projectError || !project) {
    redirect('/dashboard/admin/projects')
  }

  // Type the project explicitly
  const typedProject = project as Database['public']['Tables']['projects']['Row']

  // Get client name
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', typedProject.client_id)
    .single()

  type ClientProfile = Database['public']['Tables']['profiles']['Row']
  const typedClientProfile: Pick<ClientProfile, 'full_name'> | null = clientProfile as Pick<ClientProfile, 'full_name'> | null

  // Get tasks for this project
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  // Type for tasks with profile relations
  type TaskWithProfiles = Database['public']['Tables']['tasks']['Row'] & {
    assigned_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null
    client_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null
  }

  // Fetch assigned and client profiles separately and merge with tasks
  let tasksWithProfiles: TaskWithProfiles[] = []
  if (tasks && tasks.length > 0) {
    const typedTasks = tasks as Database['public']['Tables']['tasks']['Row'][]
    
    // Get unique assigned and client user IDs
    const assignedIds = [...new Set(typedTasks.map(t => t.assigned_to).filter(Boolean) as string[])]
    const clientIds = [...new Set(typedTasks.map(t => t.client_id).filter(Boolean) as string[])]
    
    // Fetch assigned profiles
    let assignedProfilesMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>()
    if (assignedIds.length > 0) {
      const { data: assignedProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', assignedIds)

      if (assignedProfiles) {
        const typedProfiles = assignedProfiles as Database['public']['Tables']['profiles']['Row'][]
        assignedProfilesMap = new Map(
          typedProfiles.map((p) => [p.id, { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url }])
        )
      }
    }

    // Fetch client profiles
    let clientProfilesMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>()
    if (clientIds.length > 0) {
      const { data: clientProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', clientIds)

      if (clientProfiles) {
        const typedClientProfiles = clientProfiles as Database['public']['Tables']['profiles']['Row'][]
        clientProfilesMap = new Map(
          typedClientProfiles.map((p) => [p.id, { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url }])
        )
      }
    }

    // Merge profiles with tasks
    tasksWithProfiles = typedTasks.map((task) => ({
      ...task,
      assigned_profile: task.assigned_to ? (assignedProfilesMap.get(task.assigned_to) || null) : null,
      client_profile: task.client_id ? (clientProfilesMap.get(task.client_id) || null) : null,
    }))
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/dashboard/admin/projects">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <EditableProjectName
              projectId={typedProject.id}
              initialName={typedProject.name}
              className="text-3xl font-semibold tracking-tight text-foreground"
            />
            <div className="mt-2 flex items-center gap-4">
              <StatusBadge status={typedProject.status} />
              <span className="text-sm text-muted-foreground">
                Client: {typedClientProfile?.full_name || 'Unknown'}
              </span>
              <span className="text-sm text-muted-foreground">
                Created: {new Date(typedProject.created_at).toLocaleDateString()}
              </span>
            </div>
            {typedProject.description && (
              <p className="mt-4 text-muted-foreground">{typedProject.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Tasks</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tasksWithProfiles?.length || 0} task{(tasksWithProfiles?.length || 0) !== 1 ? 's' : ''} in this project
            </p>
          </div>
        </div>

        {/* Task Stats */}
        {tasksWithProfiles && tasksWithProfiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatusCard 
              label="Drafts" 
              count={tasksWithProfiles.filter(t => t.status === 'drafts').length} 
              icon={FileEdit} 
            />
            <StatusCard 
              label="In Progress" 
              count={tasksWithProfiles.filter(t => t.status === 'in_progress').length} 
              icon={PlayCircle} 
            />
            <StatusCard 
              label="Completed" 
              count={tasksWithProfiles.filter(t => t.status === 'completed').length} 
              icon={CheckCircle2} 
            />
            <StatusCard 
              label="Archived" 
              count={tasksWithProfiles.filter(t => t.status === 'archived').length} 
              icon={Archive} 
            />
          </div>
        )}

        {/* Search and Filter */}
        <SearchFilter 
          placeholder="Search by task title, description, type, or platform..."
          searchParamKey="search"
          dateFromParamKey="dateFrom"
          dateToParamKey="dateTo"
        />
      </div>

      <TaskListWithTabs
        tasks={tasksWithProfiles}
        isAdmin={true}
        searchQuery={searchParamsData.search}
        dateFrom={searchParamsData.dateFrom}
        dateTo={searchParamsData.dateTo}
      />
    </div>
  )
}
