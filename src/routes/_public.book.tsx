import { createFileRoute } from '@tanstack/react-router'
import Booking from '@/screens/public/Booking'

export const Route = createFileRoute('/_public/book')({
  head: () => ({
    meta: [
      { title: 'Book Your Stall — TCV Bazaar 2026 Diwali Edition' },
      { name: 'description', content: 'Pick your package, choose your stall on the live layout, pay online and receive an instant Booking ID.' },
      { property: 'og:title', content: 'Book Your Stall — TCV Bazaar 2026 Diwali Edition' },
      { property: 'og:description', content: 'Pick your package, choose your stall on the live layout, pay online and receive an instant Booking ID.' },
      { property: 'og:url', content: 'https://tcvbazaar.com/book' },
    ],
    links: [{ rel: 'canonical', href: 'https://tcvbazaar.com/book' }],
  }),
  component: () => <Booking />,
})
