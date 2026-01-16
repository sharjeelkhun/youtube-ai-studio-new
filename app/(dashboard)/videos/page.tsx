import { Suspense } from 'react'
import { VideosContent } from './videos-content'
import VideosLoading from './loading'

export default function VideosPage() {
  return (
    <Suspense fallback={<VideosLoading />}>
      <VideosContent />
    </Suspense>
  )
}
