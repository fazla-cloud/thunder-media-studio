'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/database'
import { Edit2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type User = Database['public']['Tables']['profiles']['Row'] & {
  email: string
}

interface UsersManagerProps {
  initialUsers: User[]
}

const roleColors: Record<string, string> = {
  admin: 'bg-primary text-primary-foreground',
  client: 'bg-muted text-foreground',
  designer: 'bg-chart-1 text-foreground',
  marketer: 'bg-chart-2 text-foreground',
}

export function UsersManager({ initialUsers }: UsersManagerProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ role: string; title: string | null } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  // Initialize users state
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const handleEdit = (user: User) => {
    setEditingId(user.id)
    setEditData({
      role: user.role,
      title: user.title || '',
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData(null)
  }

  const handleSave = async (userId: string) => {
    if (!editData) return

    setLoading(userId)
    try {
      const supabase = createClient()
      const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
        role: editData.role as Database['public']['Tables']['profiles']['Row']['role'],
        title: editData.title || null,
      }
      
      const { error } = await (supabase
        .from('profiles') as any)
        .update(updatePayload)
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, role: editData.role as any, title: editData.title || null }
          : u
      ))
      setEditingId(null)
      setEditData(null)
      router.refresh()
    } catch (err: any) {
      console.error('Error updating user:', err)
      alert(err.message || 'Failed to update user')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isEditing = editingId === user.id
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.full_name || 'No name'}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select
                      value={editData?.role || ''}
                      onValueChange={(value) =>
                        setEditData(prev => prev ? { ...prev, role: value } : null)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="marketer">Marketer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={cn('font-medium', roleColors[user.role] || roleColors.client)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editData?.title || ''}
                      onChange={(e) =>
                        setEditData(prev => prev ? { ...prev, title: e.target.value } : null)
                      }
                      placeholder="e.g., Senior Designer"
                      className="w-48"
                    />
                  ) : (
                    <span className={user.title ? 'font-medium' : 'text-muted-foreground'}>
                      {user.title || 'No title'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSave(user.id)}
                        disabled={loading === user.id}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={loading === user.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
