import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ProjectsList } from '@/components/projects/ProjectsList'
import { SearchFilter } from '@/components/common/SearchFilter'
import { NewProjectButton } from '@/components/projects/NewProjectButton'
import { Database } from '@/types/database'

export default async function ClientProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; dateFrom?: string; dateTo?: string }>
}) {
  const profile = await requireRole('client')
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
    .eq('client_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
  }

  // Type the projects explicitly
  const typedProjects = (projects || []) as Database['public']['Tables']['projects']['Row'][]

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
    filteredProjects = filteredProjects.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    )
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

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">Manage your projects</p>
        </div>
        <NewProjectButton clientId={profile.id} />
      </div>

      <SearchFilter 
        placeholder="Search by project name or description..."
        searchParamKey="search"
        dateFromParamKey="dateFrom"
        dateToParamKey="dateTo"
      />

      <ProjectsList 
        projects={filteredProjects}
        allProjects={typedProjects}
        initialStatus={statusFilter}
        clientId={profile.id}
      />
    </div>
  )
}
