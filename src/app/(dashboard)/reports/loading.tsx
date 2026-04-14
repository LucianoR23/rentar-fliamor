import { PageHeaderSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton'

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  )
}
