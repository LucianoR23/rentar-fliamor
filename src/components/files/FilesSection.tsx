'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { FileUpload } from './FileUpload'
import { FileList } from './FileList'

type EntityType = 'unit' | 'contract' | 'expense' | 'group_expense' | 'material' | 'repair'

interface FileRecord {
  id: string
  name: string
  r2Url: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string
  createdAt: Date | string
}

interface FilesSectionProps {
  entityType: EntityType
  entityId: string
  initialFiles: FileRecord[]
  canUpload?: boolean
  canDelete?: boolean
}

export function FilesSection({ entityType, entityId, initialFiles, canUpload = true, canDelete = false }: FilesSectionProps) {
  const router = useRouter()
  const [files, setFiles] = useState<FileRecord[]>(initialFiles)

  function handleUploaded() {
    router.refresh()
  }

  function handleDeleted(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    toast.success('Archivo eliminado')
  }

  return (
    <Card>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Archivos adjuntos</h2>
      <FileList files={files} canDelete={canDelete} onDeleted={handleDeleted} />
      {canUpload && (
        <FileUpload entityType={entityType} entityId={entityId} onUploaded={handleUploaded} />
      )}
    </Card>
  )
}
