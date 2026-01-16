'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog'
import { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assigned_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Map<string, string>>(new Map())
  const [clients, setClients] = useState<Map<string, string | null>>(new Map())
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    // Fetch tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
    } else if (tasksData) {
      // Type tasks explicitly
      const typedTasks = tasksData as Database['public']['Tables']['tasks']['Row'][]
      
      // Get unique assigned user IDs
      const assignedIds = [...new Set(typedTasks.map(t => t.assigned_to).filter(Boolean) as string[])]
      
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
            typedProfiles.map(p => [p.id, { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url }])
          )
        }
      }

      // Type for tasks with profile relations
      type TaskWithProfile = Database['public']['Tables']['tasks']['Row'] & {
        assigned_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null
      }

      // Merge assigned profiles with tasks
      const tasksWithProfiles: TaskWithProfile[] = typedTasks.map((task) => ({
        ...task,
        assigned_profile: task.assigned_to ? (assignedProfilesMap.get(task.assigned_to) || null) : null,
      }))

      setTasks(tasksWithProfiles)

      // Get project and client IDs
      const projectIds = tasksData.map((t: any) => t.project_id)
      const clientIds = tasksData.map((t: any) => t.client_id)

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds)

      if (projectsData) {
        const typedProjects = projectsData as Database['public']['Tables']['projects']['Row'][]
        const projectMap = new Map(
          typedProjects.map(p => [p.id, p.name])
        )
        setProjects(projectMap)
      }

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', clientIds)

      if (clientsData) {
        const typedClients = clientsData as Database['public']['Tables']['profiles']['Row'][]
        const clientMap = new Map(
          typedClients.map(c => [c.id, c.full_name])
        )
        setClients(clientMap)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [supabase, refreshKey])

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">All Tasks</h1>
          <p className="text-muted-foreground mt-2">View and manage all tasks</p>
        </div>
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">All Tasks</h1>
          <p className="text-muted-foreground mt-2">View and manage all tasks</p>
        </div>

        {tasks.length > 0 ? (
          <div className="rounded-lg border border-border overflow-x-auto shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const projectName = projects.get(task.project_id) || '-'
                  const clientName = clients.get(task.client_id) || 'Unknown'
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{projectName}</TableCell>
                      <TableCell>{clientName}</TableCell>
                      <TableCell>{task.content_type}</TableCell>
                      <TableCell>{task.platform}</TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditDialogOpen(task.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No tasks found.</p>
          </div>
        )}
      </div>

      {/* Edit Task Dialogs */}
      {tasks.map((task) => (
        <EditTaskDialog
          key={task.id}
          open={editDialogOpen === task.id}
          onOpenChange={(open) => {
            setEditDialogOpen(open ? task.id : null)
            if (!open) {
              // Refresh data when dialog closes
              setRefreshKey(prev => prev + 1)
            }
          }}
          taskId={task.id}
          initialTask={task}
        />
      ))}
    </>
  )
}
