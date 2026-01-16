import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminProjectsList } from '@/components/projects/AdminProjectsList'
import { SearchFilter } from '@/components/common/SearchFilter'
import { Database } from '@/types/database'

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; dateFrom?: string; dateTo?: string }>
}) {
  const profile = await requireRole('admin')
  const supabase = await createClient()
  const params = await searchParams
  const statusFilter = params.status || 'all'
  const searchQuery = params.search || ''
  const dateFrom = params.dateFrom || ''
  const dateTo = params.dateTo || ''

  // Get all projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
  }

  // Type the projects explicitly
  const typedProjects = (projects || []) as Database['public']['Tables']['projects']['Row'][]

  // Get client names
  const clientIds = typedProjects.map(p => p.client_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', clientIds)

  const typedProfiles = (profiles || []) as Database['public']['Tables']['profiles']['Row'][]
  const clientMap = new Map(typedProfiles.map(p => [p.id, p.full_name]))

  // Filter projects by status if needed
  let filteredProjects = typedProjects
  if (statusFilter !== 'all') {
    filteredProjects = filteredProjects.filter(
      (p) => p.status === statusFilter
    )
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredProjects = filteredProjects.filter((p) => {
      const clientName = (clientMap.get(p.client_id) || '').toLowerCase()
      return (
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        clientName.includes(query)
      )
    })
  }

  // Filter by date range
  if (dateFrom || dateTo) {
    filteredProjects = filteredProjects.filter((p) => {
      const projectDate = new Date(p.created_at).toISOString().split('T')[0]
      if (dateFrom && projectDate < dateFrom) return false
      if (dateTo && projectDate > dateTo) return false
      return true
    })
  }

  // Add client names and tasks to projects for the card component
  const projectsWithClient = filteredProjects.map(project => ({
    ...project,
    clientName: clientMap.get(project.client_id) || 'Unknown',
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">All Projects</h1>
        <p className="text-muted-foreground mt-2">View all projects from all clients</p>
      </div>

      <SearchFilter 
        placeholder="Search by project name, description, or client name..."
        searchParamKey="search"
        dateFromParamKey="dateFrom"
        dateToParamKey="dateTo"
      />

      <AdminProjectsList 
        projects={projectsWithClient}
        allProjects={typedProjects}
        initialStatus={statusFilter}
        clientMap={clientMap}
      />
    </div>
  )
}
