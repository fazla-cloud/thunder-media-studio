'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NewProjectForm } from './NewProjectForm'

interface NewProjectDialogProps {
  clientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewProjectDialog({ clientId, open, onOpenChange }: NewProjectDialogProps) {
  const router = useRouter()

  const handleSuccess = () => {
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[calc(100%-3rem)] sm:!max-w-2xl max-h-[90vh] overflow-y-auto !p-4 sm:!p-6">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">Create New Project</DialogTitle>
          <DialogDescription className="text-sm">
            Create a new project to organize your tasks
          </DialogDescription>
        </DialogHeader>
        <NewProjectForm 
          clientId={clientId} 
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
