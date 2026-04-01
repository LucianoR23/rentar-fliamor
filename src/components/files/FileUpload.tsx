'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type EntityType = 'unit' | 'contract' | 'expense' | 'group_expense'

interface FileUploadProps {
  entityType: EntityType
  entityId: string
  onUploaded?: () => void
  accept?: string
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

const ACCEPTED_MIME: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'application/pdf': 'PDF',
}

const DEFAULT_ACCEPT = Object.keys(ACCEPTED_MIME).join(',')

export function FileUpload({ entityType, entityId, onUploaded, accept = DEFAULT_ACCEPT }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFile(file: File) {
    if (!ACCEPTED_MIME[file.type]) {
      setError('Tipo de archivo no permitido. Solo JPG, PNG, WEBP y PDF.')
      setState('error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo supera el límite de 10 MB.')
      setState('error')
      return
    }

    setState('uploading')
    setError(null)

    // Step 1: get presigned URL
    const uploadRes = await fetch('/api/files/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        entityType,
        entityId,
      }),
    })

    if (!uploadRes.ok) {
      const json = await uploadRes.json().catch(() => ({})) as { error?: string }
      setError(json.error ?? 'Error al iniciar la subida')
      setState('error')
      return
    }

    const { presignedUrl, key, publicUrl } = await uploadRes.json() as {
      presignedUrl: string
      key: string
      publicUrl: string
    }

    // Step 2: PUT directly to R2
    const putRes = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    if (!putRes.ok) {
      setError('Error al subir el archivo a R2')
      setState('error')
      return
    }

    // Step 3: confirm
    const confirmRes = await fetch('/api/files/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        publicUrl,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        entityType,
        entityId,
      }),
    })

    if (!confirmRes.ok) {
      setError('Error al confirmar el archivo')
      setState('error')
      return
    }

    setState('success')
    onUploaded?.()

    setTimeout(() => setState('idle'), 2000)
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    uploadFile(files[0])
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => state === 'idle' && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          state === 'idle' && !dragOver && 'border-border hover:border-primary/50 cursor-pointer',
          dragOver && 'border-primary bg-primary/5 cursor-copy',
          state === 'uploading' && 'border-border opacity-60 cursor-not-allowed',
          state === 'success' && 'border-success/50 bg-success/5',
          state === 'error' && 'border-destructive/50 bg-destructive/5',
        )}
      >
        {state === 'uploading' && (
          <>
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            <p className="text-xs text-muted-foreground">Subiendo…</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 className="h-6 w-6 text-success" />
            <p className="text-xs text-success font-medium">Archivo subido</p>
          </>
        )}
        {state === 'error' && (
          <>
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
            <Button type="button" size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setState('idle'); setError(null) }}>
              Reintentar
            </Button>
          </>
        )}
        {state === 'idle' && (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Arrastrá o hacé click para subir</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP, PDF — máx. 10 MB</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
