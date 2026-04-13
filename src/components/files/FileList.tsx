'use client'

import { useState } from 'react'
import { FileText, Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileRecord {
  id: string
  name: string
  r2Url: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string
  createdAt: Date | string
}

interface FileListProps {
  files: FileRecord[]
  canDelete?: boolean
  onDeleted?: (id: string) => void
  className?: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-primary shrink-0" />
  return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
}

export function FileList({ files, canDelete = false, onDeleted, className }: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (files.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin archivos adjuntos.</p>
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este archivo?')) return
    setDeletingId(id)
    const res = await fetch(`/api/files/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      onDeleted?.(id)
    }
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {files.map((file) => (
        <li key={file.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
          <FileIcon mimeType={file.mimeType} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.sizeBytes)} · {file.uploadedBy}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button asChild size="icon" variant="ghost" className="h-7 w-7">
              <a href={file.r2Url} target="_blank" rel="noopener noreferrer" title="Ver archivo">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            {canDelete && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDelete(file.id)}
                disabled={deletingId === file.id}
                title="Eliminar archivo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
