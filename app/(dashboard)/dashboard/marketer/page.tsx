import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { TaskListWithTabs } from '@/components/tasks/TaskListWithTabs'
import { CheckSquare, Clock, CheckCircle2, Briefcase } from 'lucide-react'
import { Database } from '@/types/database'

export default async function MarketerDashboard() {
  const profile = await requireRole('marketer')
  const supabase = await createClient()

  // Get tasks assigned to this marketer with profile info
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects(name),
      assigned_profile:profiles!assigned_to(id, full_name, avatar_url),
      client_profile:profiles!client_id(id, full_name, avatar_url)
    `)
    .eq('assigned_to', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error)
  }

  // Type the tasks explicitly
  type TaskWithRelations = Database['public']['Tables']['tasks']['Row'] & {
    projects?: { name: string }
    assigned_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null
    client_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null
  }

  const assignedTasks = (tasks || []) as TaskWithRelations[]
  const totalTasks = assignedTasks.length
  const inProgressTasks = assignedTasks.filter(t => t.status === 'in_progress').length
  const completedTasks = assignedTasks.filter(t => t.status === 'completed').length
  const draftsTasks = assignedTasks.filter(t => t.status === 'drafts').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Marketer Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {profile.full_name || 'Marketer'}{profile.title ? ` - ${profile.title}` : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <DashboardCard
          title="Total Tasks"
          value={totalTasks}
          icon={Briefcase}
          description="All assigned tasks"
        />
        <DashboardCard
          title="Drafts"
          value={draftsTasks}
          icon={CheckSquare}
          description="Draft tasks"
        />
        <DashboardCard
          title="In Progress"
          value={inProgressTasks}
          icon={Clock}
          description="Currently working on"
        />
        <DashboardCard
          title="Completed"
          value={completedTasks}
          icon={CheckCircle2}
          description="Finished tasks"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-4">My Assigned Tasks</h2>
        <TaskListWithTabs
          tasks={assignedTasks}
          showProject={true}
        />
      </div>
    </div>
  )
}
