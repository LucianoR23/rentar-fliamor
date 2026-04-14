import { PageHeaderSkeleton, FormSkeleton } from '@/components/shared/LoadingSkeleton'

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <FormSkeleton />
    </div>
  )
}
