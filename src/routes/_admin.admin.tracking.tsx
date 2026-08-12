import { createFileRoute } from '@tanstack/react-router'
import TrackingPixels from '@/screens/admin/TrackingPixels'

export const Route = createFileRoute('/_admin/admin/tracking')({
  component: TrackingPixels,
})