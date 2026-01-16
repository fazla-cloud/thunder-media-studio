'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FolderKanban, CheckSquare, Settings } from 'lucide-react'
import { NewProjectDialog } from '@/components/projects/NewProjectDialog'
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog'

interface QuickActionsProps {
  role: 'client' | 'admin'
  clientId?: string
}

const clientActions = [
  {
    title: 'New Project',
    description: 'Create a new project',
    action: 'new-project',
    icon: FolderKanban,
  },
  {
    title: 'New Task',
    description: 'Create a new task',
    action: 'new-task',
    icon: CheckSquare,
  },
  {
    title: 'View Projects',
    description: 'Browse all projects',
    href: '/dashboard/client/projects',
    icon: FolderKanban,
  },
]

const adminActions = [
  {
    title: 'Assign Task',
    description: 'Assign tasks to designers',
    href: '/dashboard/admin/tasks/assign',
    icon: CheckSquare,
  },
  {
    title: 'All Tasks',
    description: 'View all tasks',
    href: '/dashboard/admin/tasks',
    icon: CheckSquare,
  },
  {
    title: 'All Projects',
    description: 'View all projects',
    href: '/dashboard/admin/projects',
    icon: FolderKanban,
  },
  {
    title: 'Settings',
    description: 'Manage platform settings',
    href: '/dashboard/admin/settings',
    icon: Settings,
  },
]

export function QuickActions({ role, clientId }: QuickActionsProps) {
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const actions = role === 'admin' ? adminActions : clientActions

  const handleAction = (action?: string) => {
    if (action === 'new-project') {
      setNewProjectOpen(true)
    } else if (action === 'new-task') {
      setNewTaskOpen(true)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => {
              const Icon = action.icon
              if (action.href) {
                return (
                  <Link key={action.title} href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full h-auto flex-col items-start justify-start p-4 hover:bg-accent transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon className="h-5 w-5 shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{action.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </Link>
                )
              }
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="w-full h-auto flex-col items-start justify-start p-4 hover:bg-accent transition-all duration-200"
                  onClick={() => 'action' in action && handleAction(action.action)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon className="h-5 w-5 shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {clientId && (
        <>
          <NewProjectDialog
            clientId={clientId}
            open={newProjectOpen}
            onOpenChange={setNewProjectOpen}
          />
          <NewTaskDialog
            clientId={clientId}
            open={newTaskOpen}
            onOpenChange={setNewTaskOpen}
          />
        </>
      )}
    </>
  )
}
