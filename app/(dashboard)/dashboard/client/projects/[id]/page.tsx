import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { TaskListWithTabs } from '@/components/tasks/TaskListWithTabs'
import { TaskRefreshHandler } from '@/components/tasks/TaskRefreshHandler'
import { StatusCard } from '@/components/tasks/StatusCard'
import { SearchFilter } from '@/components/common/SearchFilter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { NewTaskButton } from '@/components/tasks/NewTaskButton'
import { EditableProjectName } from '@/components/projects/EditableProjectName'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, FileEdit, PlayCircle, CheckCircle2, Archive } from 'lucide-react'
import { Database } from '@/types/database'

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ search?: string; dateFrom?: string; dateTo?: string }>
}) {
  const profile = await requireRole('client')
  const { id } = await params
  const searchParamsData = await searchParams
  const supabase = await createClient()

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('client_id', profile.id)
    .single()

  if (projectError || !project) {
    redirect('/dashboard/client/projects')
  }

  // Type the project explicitly
  const typedProject = project as Database['public']['Tables']['projects']['Row']

  // Get tasks for this project
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', id)
    .eq('client_id', profile.id)
    .order('created_at', { ascending: false })

  // Type for tasks with profile relations
  type TaskWithProfiles = Database['public']['Tables']['tasks']['Row'] & {
    assigned_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null
  }

  // Fetch assigned profiles separately and merge with tasks
  let tasksWithProfiles: TaskWithProfiles[] = []
  if (tasks && tasks.length > 0) {
    const typedTasks = tasks as Database['public']['Tables']['tasks']['Row'][]
    
    // Get unique assigned user IDs (including null checks)
    const assignedIds = [...new Set(typedTasks.map(t => t.assigned_to).filter(Boolean) as string[])]
    
    if (assignedIds.length > 0) {
      // Fetch assigned profiles
      const { data: assignedProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', assignedIds)

      if (profilesError) {
        console.error('Error fetching assigned profiles:', profilesError)
      }

      if (assignedProfiles && assignedProfiles.length > 0) {
        const typedProfiles = assignedProfiles as Database['public']['Tables']['profiles']['Row'][]
        const assignedProfilesMap = new Map(
          typedProfiles.map((p) => [p.id, { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url }])
        )

        // Merge assigned profiles with tasks
        tasksWithProfiles = typedTasks.map((task) => ({
          ...task,
          assigned_profile: task.assigned_to ? (assignedProfilesMap.get(task.assigned_to) || null) : null,
        }))
      } else {
        // If no profiles found but tasks have assigned_to, log for debugging
        console.warn('Tasks have assigned_to but profiles not found:', assignedIds)
        tasksWithProfiles = typedTasks.map((task) => ({
          ...task,
          assigned_profile: null,
        }))
      }
    } else {
      // No assigned tasks, but ensure structure is correct
      tasksWithProfiles = typedTasks.map((task) => ({
        ...task,
        assigned_profile: null,
      }))
    }
  }


  // Count tasks by status
  const taskCounts = {
    total: tasksWithProfiles?.length || 0,
    drafts: tasksWithProfiles?.filter((t: any) => t.status === 'drafts').length || 0,
    in_progress: tasksWithProfiles?.filter((t: any) => t.status === 'in_progress').length || 0,
    completed: tasksWithProfiles?.filter((t: any) => t.status === 'completed').length || 0,
    archived: tasksWithProfiles?.filter((t: any) => t.status === 'archived').length || 0,
  }

  return (
    <div className="p-8">
      <TaskRefreshHandler />
      {/* Header with back button */}
      <div className="mb-6">
        <Link href="/dashboard/client/projects">
          <Button variant="ghost" className="mb-4 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      {/* Project Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <EditableProjectName
                projectId={typedProject.id}
                initialName={typedProject.name}
                className="text-2xl font-semibold tracking-tight mb-2"
              />
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={typedProject.status} />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created {new Date(typedProject.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>
            <NewTaskButton clientId={profile.id} projectId={id} />
          </div>
        </CardHeader>
        {typedProject.description && (
          <CardContent>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{typedProject.description}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tasks Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Tasks</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {taskCounts.total} task{(taskCounts.total !== 1 ? 's' : '')} in this project
            </p>
          </div>
        </div>

        {/* Task Stats */}
        {taskCounts.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatusCard label="Drafts" count={taskCounts.drafts} icon={FileEdit} />
            <StatusCard label="In Progress" count={taskCounts.in_progress} icon={PlayCircle} />
            <StatusCard label="Completed" count={taskCounts.completed} icon={CheckCircle2} />
            <StatusCard label="Archived" count={taskCounts.archived} icon={Archive} />
          </div>
        )}

        {/* Search and Filter */}
        <SearchFilter 
          placeholder="Search by task title, description, type, or platform..."
          searchParamKey="search"
          dateFromParamKey="dateFrom"
          dateToParamKey="dateTo"
        />

        {/* Tasks List */}
        <TaskListWithTabs 
          tasks={(tasksWithProfiles as Array<Database['public']['Tables']['tasks']['Row'] & { assigned_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null }>) || []}
          searchQuery={searchParamsData.search}
          dateFrom={searchParamsData.dateFrom}
          dateTo={searchParamsData.dateTo}
        />
      </div>
    </div>
  )
}
