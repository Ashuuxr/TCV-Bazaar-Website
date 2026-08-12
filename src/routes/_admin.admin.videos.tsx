import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/VideoManager'

export const Route = createFileRoute('/_admin/admin/videos')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — VideoManager' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
