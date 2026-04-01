'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { User } from '@/types'

interface UsersTableProps {
  data: User[]
  currentUserId: string
}

export function UsersTable({ data, currentUserId }: UsersTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleRoleToggle(user: User) {
    const newRole = user.role === 'superadmin' ? 'viewer' : 'superadmin'
    setUpdatingId(user.id)
    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setUpdatingId(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/users/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((user) => {
              const isSelf = user.id === currentUserId
              return (
                <tr key={user.id} className="bg-card">
                  <td className="px-4 py-3 font-medium">
                    {user.name}
                    {isSelf && (
                      <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={user.role === 'superadmin' ? 'Superadmin' : 'Viewer'}
                      variant={user.role === 'superadmin' ? 'primary' : 'muted'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {!isSelf && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === user.id}
                            onClick={() => handleRoleToggle(user)}
                          >
                            {updatingId === user.id
                              ? '...'
                              : user.role === 'superadmin'
                              ? '→ Viewer'
                              : '→ Superadmin'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar usuario"
        description="El usuario perderá acceso inmediatamente y será eliminado del sistema."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
