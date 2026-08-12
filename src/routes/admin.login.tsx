import { createFileRoute } from '@tanstack/react-router'
import Login from '@/screens/admin/Login'

export const Route = createFileRoute('/admin/login')({
  head: () => ({ meta: [{ title: 'Admin Login — TCV Bazaar' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Login,
})
