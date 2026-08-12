import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/Media'

export const Route = createFileRoute('/_admin/admin/media')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — Media' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
