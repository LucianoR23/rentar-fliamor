import { Skeleton } from '@/components/ui/skeleton'

export function PageHeaderSkeleton({ hasAction = false }: { hasAction?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32 mt-1.5" />
      </div>
      {hasAction && <Skeleton className="h-8 w-32" />}
    </div>
  )
}

export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 pb-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-28 ml-auto" />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/30 px-4 h-10 flex items-center gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 h-10 flex items-center gap-4 border-t border-border">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-4 max-w-2xl">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-75 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-3 rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-75 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div>
      <PageHeaderSkeleton hasAction />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-3 w-28" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-28" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-3 w-24" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-4 w-36 mb-4" />
          <Skeleton className="h-70 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
